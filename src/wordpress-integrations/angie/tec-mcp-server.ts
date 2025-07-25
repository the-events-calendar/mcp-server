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
  const postType = params?.postType;
  const id = params?.id;
  
  if (!postType || !ENDPOINTS[postType]) {
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
      source: 'mcp-server',
      generated: new Date().toISOString(),
      postTypes: extractPostTypes(tool.inputSchema)
    }
  }));
}

// Enrich tool definitions with metadata
const tecTools = enrichToolsWithMetadata(toolsData as ToolDefinition[]);

/**
 * Create The Events Calendar MCP Server
 */
function createTecMcpServer(): McpServer {
  const server = new McpServer(
    { name: 'tec-calendar-server', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  // Register list tools handler
  (server as any).setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tecTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }))
  }));

  // Register call tool handler
  (server as any).setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args = {} } = request.params;
    
    // Check if we have wpApiSettings
    if (!window.wpApiSettings) {
      throw new Error('WordPress API settings not found. Make sure wp_localize_script is called.');
    }
    
    const { root, nonce } = window.wpApiSettings;
    
    // Find the tool
    const tool = tecTools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    try {
      // Handle current-datetime locally
      if (name === 'tec-calendar-current-datetime') {
        const now = new Date();
        const timezone = args?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        
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
      const endpoint = buildEndpointForTool(name, args);
      const url = `${root}${endpoint}`;
      
      // Determine HTTP method
      let method = 'GET';
      let body = undefined;
      
      switch (name) {
        case 'tec-calendar-create-update-entities':
          method = args.id ? 'PUT' : 'POST';
          body = JSON.stringify((args as any).data || {});
          break;
        case 'tec-calendar-delete-entities':
          method = 'DELETE';
          break;
      }
      
      // Make API request to WordPress
      const response = await fetch(url, {
        method,
        headers: {
          'X-WP-Nonce': nonce,
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body,
      });
      
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
      
      // Handle list responses which may have data under a resource key
      let data = result;
      if (name === 'tec-calendar-read-entities' && !(args as any).id && (args as any).postType) {
        const resourceKey = ENDPOINTS[(args as any).postType]?.resource;
        if (resourceKey && (result as any)[resourceKey]) {
          data = (result as any)[resourceKey];
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
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  });

  return server;
}

/**
 * Initialize and register the MCP server with Angie
 */
async function initializeTecMcpServer(): Promise<void> {
  try {
    const server = createTecMcpServer();
    const sdk = new AngieMcpSdk();
    
    const config: AngieServerConfig = {
      name: 'tec-calendar-server',
      version: '1.0.0',
      description: 'The Events Calendar tools for managing events, venues, organizers, and tickets',
      server,
    };
    
    await sdk.registerServer(config);
    
    console.log('TEC MCP Server registered successfully');
    
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
    console.error('Failed to initialize TEC MCP Server:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTecMcpServer);
} else {
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