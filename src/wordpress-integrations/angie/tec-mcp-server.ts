/**
 * MCP Server for The Events Calendar - Angie Integration (Simplified)
 * 
 * This creates a complete MCP server using the Angie SDK that can be
 * bundled and included in a WordPress plugin.
 */

/// <reference lib="dom" />

import { AngieMcpSdk } from '@elementor/angie-sdk';
import * as chrono from 'chrono-node';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
  type ServerCapabilities
} from '@modelcontextprotocol/sdk/types.js';

// Import tool definitions
import toolsData from './tools-data.json' with { type: 'json' };
import { VERSION } from '../../version.js';

// Type for our tool definitions
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

// Build default MCP instructions (browser-safe: no server imports needed)
function buildInstructions(): string {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const timezoneOffset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const iso8601 = now.toISOString();
  const iso8601Space = iso8601.replace('T', ' ').replace('Z', '');

  const today = `${year}-${month}-${day}`;
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;
  const nextWeek = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

  const todayAt3pm = `${today} 15:00:00`;
  const tomorrowAt10am = `${tomorrow} 10:00:00`;

  return [
    '### The Events Calendar MCP Server Instructions',
    '',
    '**Purpose**: Interact with WordPress posts for Events, Venues, Organizers, and Tickets using the provided tools.',
    '',
    '### Time Context (precomputed to avoid extra calls)',
    `- **Local time**: ${datetime} (${timezone}, UTC offset ${timezoneOffset})`,
    `- **ISO (UTC)**: ${iso8601Space}`,
    '- **Usage hints**:',
    `  - **today_3pm**: ${todayAt3pm}`,
    `  - **tomorrow_10am**: ${tomorrowAt10am}`,
    `  - **next_week**: ${nextWeek}`,
    '',
    '### Date and Time Handling',
    '- **Events**: Use dates in `YYYY-MM-DD HH:MM:SS` format (e.g., "2025-01-15 14:30:00")',
    '- **Tickets**: All availability dates must be in `YYYY-MM-DD HH:MM:SS` format',
    '- **Sale price dates**: Use `YYYY-MM-DD` format',
    '- Prefer not sending a `timezone` field unless explicitly needed. Do not guess timezones.',
    '- When a timezone is required, use the site\'s timezone context; otherwise omit.',
    '',
    '### Available Tools',
    '- **tec-calendar-read-entities**: Read, list, or search posts with filters (events/venues/organizers/tickets)',
    '- **tec-calendar-create-update-entities**: Create or update posts with proper date formatting',
    '- **tec-calendar-delete-entities**: Trash or permanently delete posts',
    '',
    '### Important Notes',
    '- **Free tickets**: Omit `price` entirely (do not set it to 0)',
    '- **Unlimited tickets**: Set `manage_stock` to false',
    '- **Response format**: Return concise JSON objects with IDs and essential fields',
    '',
    '### Post Types',
    '- **tribe_events**: Events',
    '- **tribe_venue**: Event venues',
    '- **tribe_organizer**: Event organizers',
    '- **tec_tc_ticket**: Event tickets (Commerce)',
    '- **tribe_rsvp_tickets**: RSVP tickets',
  ].join('\n');
}

// ---- Date utilities (browser-side) ----
function pad2(n: number): string { return String(n).padStart(2, '0'); }
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}
function parseFlexibleDate(input: string): Date | null {
  try {
    const s = String(input).trim();
    const d = chrono.casual.parseDate(s, new Date(), { forwardDate: true });
    if (d && Number.isFinite(d.getTime())) return d;
  } catch {}
  try {
    const results = chrono.parse(String(input));
    if (results && results.length > 0) {
      const d = results[0].date();
      if (Number.isFinite(d.getTime())) return d;
    }
  } catch {}
  const iso = new Date(String(input).replace(' ', 'T'));
  if (Number.isFinite(iso.getTime())) return iso;
  const plain = new Date(String(input));
  if (Number.isFinite(plain.getTime())) return plain;
  return null;
}
function normalizeDateFields(data: Record<string, any>) {
  if (!data || typeof data !== 'object') return { invalids: [] as { field: string; value: string }[] };
  const invalids: { field: string; value: string }[] = [];
  const dateTimeFields = ['start_date', 'end_date', 'start_date_utc', 'end_date_utc'];
  const dateOnlyFields = ['sale_price_start_date', 'sale_price_end_date'];
  const prefRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/;
  const dateOnlyRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

  for (const field of dateTimeFields) {
    if (typeof data[field] !== 'string') continue;
    const raw = String(data[field]).trim();
    const parsed = parseFlexibleDate(raw);
    if (parsed) { data[field] = formatDateTime(parsed); continue; }
    if (!prefRegex.test(raw)) invalids.push({ field, value: raw });
  }
  for (const field of dateOnlyFields) {
    if (typeof data[field] !== 'string') continue;
    const raw = String(data[field]).trim();
    const parsed = parseFlexibleDate(raw);
    if (parsed) { data[field] = formatDate(parsed); continue; }
    if (!dateOnlyRegex.test(raw)) invalids.push({ field, value: raw });
  }
  return { invalids };
}

// Extend window interface for WordPress API settings
declare global {
  interface Window {
    wpApiSettings?: {
      root: string;
      nonce: string;
    };
    TEC_MCP?: {
      server?: Server;
      tools?: any[];
      createServer: typeof createTecMcpServer;
      initialize: typeof initializeTecMcpServer;
    };
  }
}

// Define the interface locally since it's not being exported properly
interface AngieServerConfig {
  name: string;
  version: string;
  description: string;
  server: Server;
  capabilities?: ServerCapabilities;
}

// Endpoint configuration matching the API client
const ENDPOINTS: Record<string, { namespace: string; resource: string; version: string }> = {
  event: {
    namespace: 'tec',
    resource: 'events',
    version: 'v1'
  },
  venue: {
    namespace: 'tec',
    resource: 'venues',
    version: 'v1'
  },
  organizer: {
    namespace: 'tec',
    resource: 'organizers',
    version: 'v1'
  },
  ticket: {
    namespace: 'tec',
    resource: 'tickets',
    version: 'v1'
  }
};

/**
 * Build endpoint URL for a specific action
 */
function buildEndpointForTool(toolName: string, params: any): string {
  console.log(`[TEC_MCP] Building endpoint for tool:`, { toolName, params });
  const postType = params?.postType;
  const id = params?.id;
  
  if (!postType || !ENDPOINTS[postType]) {
    console.error(`[TEC_MCP] Invalid post type:`, { postType, availableTypes: Object.keys(ENDPOINTS) });
    throw new Error(`Invalid post type: ${postType}`);
  }
  
  const config = ENDPOINTS[postType];
  const base = `${config.namespace}/${config.version}/${config.resource}`;
  console.log(`[TEC_MCP] Endpoint config for ${postType}:`, {
    namespace: config.namespace,
    version: config.version,
    resource: config.resource,
    base: base
  });
  
  // Handle different tool operations
  switch (toolName) {
    case 'tec-calendar-create-update-entities':
      return id ? `${base}/${id}` : base;
    
    case 'tec-calendar-read-entities':
      if (id) {
        return `${base}/${id}`;
      }
      // For list operations, add query parameters
      const queryParams = new URLSearchParams();
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.per_page) {
        queryParams.append('per_page', Math.min(params.per_page, 100).toString());
      }
      if (params.page) {
        queryParams.append('page', params.page);
      }
      if (params.orderby) {
        queryParams.append('orderby', params.orderby);
      }
      if (params.order) {
        queryParams.append('order', params.order);
      }
      
      // Add post-type specific filters
      Object.entries(params).forEach(([key, value]) => {
        if (!['postType', 'id', 'search', 'per_page', 'page', 'orderby', 'order'].includes(key) && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const query = queryParams.toString();
      return query ? `${base}?${query}` : base;
    
    case 'tec-calendar-delete-entities':
      if (!id) {
        throw new Error('ID is required for delete operation');
      }
      const force = params.force ? '?force=true' : '';
      return `${base}/${id}${force}`;
    
    case 'tec-calendar-current-datetime':
      // Deprecated: this tool is no longer handled
      throw new Error('Unknown tool: tec-calendar-current-datetime');
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Tool definitions
const tecTools = toolsData as ToolDefinition[];
console.log(`[TEC_MCP] Loaded ${tecTools.length} tool definitions:`, tecTools.map(t => t.name));

// Log full tool definitions with annotations
console.log('[TEC_MCP] Full tool definitions with annotations:');
tecTools.forEach((tool, index) => {
  console.log(`[TEC_MCP] Tool ${index + 1}: ${tool.name}`);
  console.log(`[TEC_MCP]   Title: ${tool.annotations?.title || 'No title'}`);
  console.log(`[TEC_MCP]   Description: ${tool.description.substring(0, 100)}...`);
  console.log(`[TEC_MCP]   Annotations:`, tool.annotations);
  console.log(`[TEC_MCP]   Input Schema Properties:`, Object.keys(tool.inputSchema.properties || {}));
});

/**
 * Create The Events Calendar MCP Server
 */
function createTecMcpServer(): Server {
  console.log('[TEC_MCP] Creating server with low-level API...');
  
  const server = new Server(
    { name: 'plugin-the-events-calendar', version: VERSION },
    { capabilities: { tools: {} } }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
    console.log('[TEC_MCP] Handling tools/list request');
    const tools = tecTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    }));
    
    console.log('[TEC_MCP] Returning tools with annotations:');
    tools.forEach((tool, index) => {
      console.log(`[TEC_MCP]   ${index + 1}. ${tool.name} - ${tool.annotations?.title || 'No title'}`);
      console.log(`[TEC_MCP]      Read-only: ${tool.annotations?.readOnlyHint || false}`);
      console.log(`[TEC_MCP]      Destructive: ${tool.annotations?.destructiveHint || false}`);
    });
    
    return { tools };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name: toolName, arguments: args = {} } = request.params;
    console.log(`[TEC_MCP] Tool called: ${toolName}`, { args, request });
    
    // Check if we have wpApiSettings
    if (!window.wpApiSettings) {
      console.error('[TEC_MCP] WordPress API settings not found');
      throw new Error('WordPress API settings not found. Make sure wp_localize_script is called.');
    }
    
    const { root, nonce } = window.wpApiSettings;
    console.log(`[TEC_MCP] Using WordPress API:`, { root, nonceLength: nonce?.length });
    
    // Find the tool
    const tool = tecTools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    try {
      // No local handling for deprecated current-datetime tool
      
      // Normalize flexible dates for create/update before building the endpoint
      if (toolName === 'tec-calendar-create-update-entities' && args && args.data && typeof args.data === 'object') {
        const { invalids } = normalizeDateFields(args.data);
        if (invalids.length > 0) {
          const details = JSON.stringify({ invalid_fields: invalids });
          throw new Error(`Invalid date format. Prefer 'YYYY-MM-DD HH:MM:SS'. Details: ${details}`);
        }
      }

      // Build the endpoint URL
      const endpoint = buildEndpointForTool(toolName, args);
      const url = `${root}${endpoint}`;
      console.log(`[TEC_MCP] Built endpoint URL:`, { 
        tool: toolName, 
        endpoint, 
        fullUrl: url,
        root,
        args: JSON.stringify(args, null, 2)
      });
      
      // Determine HTTP method
      let method = 'GET';
      let body: string | undefined = undefined;
      
      switch (toolName) {
        case 'tec-calendar-create-update-entities':
          method = args.id ? 'PUT' : 'POST';
          // Default status to publish unless specified
          if (args && args.data && typeof args.data === 'object' && (args.data as any).status === undefined) {
            (args.data as any).status = 'publish';
          }
          body = JSON.stringify(args.data || {});
          break;
        case 'tec-calendar-delete-entities':
          method = 'DELETE';
          break;
      }
      
      // Make API request to WordPress
      console.log(`[TEC_MCP] Making API request:`, { 
        method, 
        url, 
        hasBody: !!body,
        bodyContent: body ? JSON.parse(body) : null
      });
      
      // Prepare headers - tickets may need different auth
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        // Add experimental endpoint acknowledgement header for TEC v1 API
        'X-TEC-EEA': 'I understand that this endpoint is experimental and may change in a future release without maintaining backward compatibility. I also understand that I am using this endpoint at my own risk, while support is not provided for it.',
      };
      
      // For tickets, try both X-WP-Nonce and also add nonce as query parameter
      let finalUrl = url;
      if (args.postType === 'ticket') {
        headers['X-WP-Nonce'] = nonce;
        // Also add nonce to URL for ticket endpoints
        finalUrl = url.includes('?') ? `${url}&_wpnonce=${nonce}` : `${url}?_wpnonce=${nonce}`;
        console.log(`[TEC_MCP] Special ticket authentication:`, {
          originalUrl: url,
          finalUrl,
          nonceInHeader: 'X-WP-Nonce',
          nonceInUrl: '_wpnonce',
          nonceValue: nonce
        });
      } else {
        headers['X-WP-Nonce'] = nonce;
        console.log(`[TEC_MCP] Standard authentication for ${args.postType}:`, {
          url,
          nonceInHeader: 'X-WP-Nonce',
          nonceValue: nonce
        });
      }
      
      console.log(`[TEC_MCP] Final request details:`, {
        url: finalUrl,
        method,
        headers,
        credentials: 'same-origin',
        bodyLength: typeof body === 'string' ? body.length : 0
      });
      
      const response = await fetch(finalUrl, {
        method,
        headers,
        credentials: 'same-origin',
        body,
      });
      console.log(`[TEC_MCP] API response:`, { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        headers: Array.from(response.headers.entries()).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.log(`[TEC_MCP] Error response body:`, error);
        let errorMessage;
        try {
          const errorJson = JSON.parse(error);
          console.log(`[TEC_MCP] Parsed error JSON:`, errorJson);
          errorMessage = errorJson.message || errorJson.code || response.statusText;
        } catch {
          console.log(`[TEC_MCP] Could not parse error as JSON, using raw text`);
          errorMessage = error || response.statusText;
        }
        throw new Error(`API request failed (${response.status}): ${errorMessage}`);
      }
      
      const result = await response.json();
      console.log(`[TEC_MCP] Raw API result:`, result);
      
      // The new TEC v1 API returns arrays directly for list responses
      let data = result;
      console.log(`[TEC_MCP] Response type:`, { 
        isArray: Array.isArray(data), 
        length: Array.isArray(data) ? data.length : 'n/a',
        type: typeof data
      });
      
      // Return in MCP format
      return {
        content: [{ 
          type: 'text', 
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) 
        }],
      };
    } catch (error: any) {
      console.error(`[TEC_MCP] Error calling tool ${toolName}:`, error);
      console.error('[TEC_MCP] Error details:', { 
        message: error.message, 
        stack: error.stack,
        tool: toolName,
        args 
      });
      throw error;
    }
  });

  return server;
}

/**
 * Initialize and register the MCP server with Angie
 */
async function initializeTecMcpServer(): Promise<void> {
  console.log('[TEC_MCP] Starting initialization...');
  try {
    console.log('[TEC_MCP] Creating MCP server...');
    const server = createTecMcpServer();
    console.log('[TEC_MCP] Server created, initializing Angie SDK...');
    const sdk = new AngieMcpSdk();
    
    const config: AngieServerConfig = {
      name: 'plugin-the-events-calendar',
      version: VERSION,
      description: buildInstructions(),
      server,
    };
    
    console.log('[TEC_MCP] Registering server with Angie SDK...', config);
    await sdk.registerServer(config);
    
    console.log('[TEC_MCP] Server registered successfully with Angie');
    
    // Expose server and tools on the global namespace
    if (!window.TEC_MCP) {
      window.TEC_MCP = {
        createServer: createTecMcpServer,
        initialize: initializeTecMcpServer
      };
    }
    window.TEC_MCP.server = server;
    window.TEC_MCP.tools = tecTools;
    
  } catch (error) {
    console.error('[TEC_MCP] Failed to initialize server:', error);
    console.error('[TEC_MCP] Initialization error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      name: (error as any)?.name
    });
  }
}

// Auto-initialize when DOM is ready
console.log('[TEC_MCP] Module loaded, checking DOM state:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[TEC_MCP] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[TEC_MCP] DOMContentLoaded fired, initializing...');
    initializeTecMcpServer();
  });
} else {
  console.log('[TEC_MCP] DOM already loaded, initializing immediately...');
  initializeTecMcpServer();
}

// Export main API
export default {
  createServer: createTecMcpServer,
  initialize: initializeTecMcpServer,
  tools: tecTools
};

// Also export named exports for direct imports
export { createTecMcpServer, initializeTecMcpServer, tecTools };

// Also expose as the expected global when bundled
if (typeof window !== 'undefined') {
  (window as any).TEC_MCP = {
    createServer: createTecMcpServer,
    initialize: initializeTecMcpServer,
    tools: tecTools
  };
}