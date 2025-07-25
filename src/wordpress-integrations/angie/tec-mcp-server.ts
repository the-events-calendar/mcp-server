/**
 * MCP Server for The Events Calendar - Angie Integration
 * 
 * This creates a complete MCP server using the Angie SDK that can be
 * bundled and included in a WordPress plugin.
 */

/// <reference lib="dom" />

import { AngieMcpSdk } from '@elementor/angie-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  type CallToolRequest,
  type ServerCapabilities
} from '@modelcontextprotocol/sdk/types.js';

// Define the interface locally since it's not being exported properly
interface AngieServerConfig {
  name: string;
  version: string;
  description: string;
  server: McpServer;
  capabilities?: ServerCapabilities;
}

// Import tool definitions - will be injected during build
import toolsData from './tools-data.json';

// Type for our tool definitions
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
}

// Extend window interface for WordPress API settings
declare global {
  interface Window {
    wpApiSettings?: {
      root: string;
      nonce: string;
    };
    TEC_MCP?: {
      server?: McpServer;
      tools?: any[];
      createServer: typeof createTecMcpServer;
      initialize: typeof initializeTecMcpServer;
    };
  }
}

// Endpoint configuration matching the API client
const ENDPOINTS: Record<string, { namespace: string; resource: string; version: string }> = {
  event: {
    namespace: 'tribe/events',
    resource: 'events',
    version: 'v1'
  },
  venue: {
    namespace: 'tribe/events',
    resource: 'venues',
    version: 'v1'
  },
  organizer: {
    namespace: 'tribe/events',
    resource: 'organizers',
    version: 'v1'
  },
  ticket: {
    namespace: 'tribe/tickets',
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
      if (params.search) queryParams.append('search', params.search);
      if (params.per_page) queryParams.append('per_page', Math.min(params.per_page, 100).toString());
      if (params.page) queryParams.append('page', params.page);
      if (params.orderby) queryParams.append('orderby', params.orderby);
      if (params.order) queryParams.append('order', params.order);
      
      // Add post-type specific filters
      Object.entries(params).forEach(([key, value]) => {
        if (!['postType', 'id', 'search', 'per_page', 'page', 'orderby', 'order'].includes(key) && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const query = queryParams.toString();
      return query ? `${base}?${query}` : base;
    
    case 'tec-calendar-delete-entities':
      if (!id) throw new Error('ID is required for delete operation');
      const force = params.force ? '?force=true' : '';
      return `${base}/${id}${force}`;
    
    case 'tec-calendar-current-datetime':
      // This doesn't need an endpoint - handled locally
      return '';
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Extract supported post types from tool schema
 */
function extractPostTypes(schema: any): string[] {
  if (schema?.properties?.postType?.enum) {
    return schema.properties.postType.enum;
  }
  return [];
}

/**
 * Transform MCP tool definitions to include Angie metadata
 */
function enrichToolsWithMetadata(tools: ToolDefinition[]): any[] {
  return tools.map(tool => ({
    ...tool,
    // Additional metadata for debugging/logging
    category: 'The Events Calendar',
    version: '1.0.0',
    metadata: {
      source: 'plugin-the-events-calendar',
      generated: new Date().toISOString(),
      postTypes: extractPostTypes(tool.inputSchema)
    }
  }));
}

// Enrich tool definitions with metadata
const tecTools = enrichToolsWithMetadata(toolsData as ToolDefinition[]);
console.log(`[TEC_MCP] Loaded ${tecTools.length} tool definitions:`, tecTools.map(t => t.name));

/**
 * Create The Events Calendar MCP Server
 */
function createTecMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'plugin-the-events-calendar', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Register each tool using the McpServer's tool method
  tecTools.forEach(toolDef => {
    console.log(`[TEC_MCP] Registering tool: ${toolDef.name}`);
    
    // Register tool with a basic schema that accepts any object
    // This avoids Zod parsing but still allows arguments to be passed
    const anyObjectSchema = {} as any; // Empty object as schema
    
    server.tool(toolDef.name, toolDef.description, anyObjectSchema, async (args, extra) => {
      console.log(`[TEC_MCP] Tool called: ${toolDef.name}`, { args, extra });
      
      // Args should now contain the actual arguments passed to the tool
      if (!args || typeof args !== 'object') {
        console.warn(`[TEC_MCP] No arguments provided for ${toolDef.name}`);
        args = {};
      }
      
      // Check if we have wpApiSettings
      if (!window.wpApiSettings) {
        console.error('[TEC_MCP] WordPress API settings not found');
        throw new Error('WordPress API settings not found. Make sure wp_localize_script is called.');
      }
      
      const { root, nonce } = window.wpApiSettings;
      console.log(`[TEC_MCP] Using WordPress API:`, { root, nonceLength: nonce?.length });
      
      try {
        // Handle current-datetime locally
        if (toolDef.name === 'tec-calendar-current-datetime') {
          console.log('[TEC_MCP] Handling current-datetime locally');
          const now = new Date();
          const timezone = (args as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                current_date: now.toISOString().split('T')[0],
                current_time: now.toTimeString().split(' ')[0],
                current_datetime: now.toISOString(),
                timezone,
                timestamp: Math.floor(now.getTime() / 1000),
                formatted: {
                  date: now.toLocaleDateString(),
                  time: now.toLocaleTimeString(),
                  full: now.toLocaleString()
                }
              }, null, 2)
            }]
          };
        }
        
        // Build the endpoint URL
        const endpoint = buildEndpointForTool(toolDef.name, args);
        const url = `${root}${endpoint}`;
        console.log(`[TEC_MCP] Built endpoint URL:`, { tool: toolDef.name, endpoint, url });
        
        // Determine HTTP method
        let method = 'GET';
        let body = undefined;
        
        switch (toolDef.name) {
          case 'tec-calendar-create-update-entities':
            method = (args as any).id ? 'PUT' : 'POST';
            body = JSON.stringify((args as any).data || {});
            break;
          case 'tec-calendar-delete-entities':
            method = 'DELETE';
            break;
        }
        
        // Make API request to WordPress
        console.log(`[TEC_MCP] Making API request:`, { method, url, hasBody: !!body });
        const response = await fetch(url, {
          method,
          headers: {
            'X-WP-Nonce': nonce,
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body,
        });
        console.log(`[TEC_MCP] API response:`, { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          const error = await response.text();
          let errorMessage;
          try {
            const errorJson = JSON.parse(error);
            errorMessage = errorJson.message || errorJson.code || response.statusText;
          } catch {
            errorMessage = error || response.statusText;
          }
          throw new Error(`API request failed (${response.status}): ${errorMessage}`);
        }
        
        const result = await response.json();
        console.log(`[TEC_MCP] Raw API result:`, result);
        
        // Handle list responses which may have data under a resource key
        let data = result;
        if (toolDef.name === 'tec-calendar-read-entities' && !(args as any).id && (args as any).postType) {
          const resourceKey = ENDPOINTS[(args as any).postType]?.resource;
          console.log(`[TEC_MCP] Checking for resource key:`, { resourceKey, hasKey: !!(result as any)[resourceKey] });
          if (resourceKey && (result as any)[resourceKey]) {
            data = (result as any)[resourceKey];
            console.log(`[TEC_MCP] Extracted data from resource key:`, { itemCount: Array.isArray(data) ? data.length : 'not-array' });
          }
        }
        
        // Return in MCP format
        return {
          content: [{ 
            type: 'text', 
            text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) 
          }],
        };
      } catch (error: any) {
        console.error(`[TEC_MCP] Error calling tool ${toolDef.name}:`, error);
        console.error('[TEC_MCP] Error details:', { 
          message: error.message, 
          stack: error.stack,
          tool: toolDef.name,
          args 
        });
        throw error;
      }
    });
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
      version: '1.0.0',
      description: 'The Events Calendar tools for managing events, venues, organizers, and tickets',
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