import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ApiClient } from './api/client.js';
import { getToolHandlers, getToolDefinitions } from './tools/index.js';

export interface ServerConfig {
  name: string;
  version: string;
  apiClient: ApiClient;
}

/**
 * Create and configure the MCP server
 */
export function createServer(config: ServerConfig): McpServer {
  const debug = process.env.DEBUG;
  
  const server = new McpServer({
    name: config.name,
    version: config.version,
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Get tool handlers and definitions
  const toolHandlers = getToolHandlers(config.apiClient);
  const toolDefinitions = getToolDefinitions();
  
  if (debug) {
    console.error('[DEBUG] Tool definitions:', toolDefinitions.map(t => ({
      name: t.name,
      hasInputSchema: !!t.inputSchema,
      hasJsonSchema: !!(t as any).jsonSchema,
      inputSchemaKeys: t.inputSchema ? Object.keys(t.inputSchema) : []
    })));
  }

  // Use the underlying server to set up tools with JSON Schema
  const underlyingServer = (server as any).server as Server;
  
  // Set up tools/list handler
  underlyingServer.setRequestHandler(ListToolsRequestSchema, async () => {
    if (debug) {
      console.error('[DEBUG] Handling tools/list request');
    }
    
    return {
      tools: toolDefinitions.map(toolDef => {
        const toolInfo = {
          name: toolDef.name,
          description: toolDef.description,
          inputSchema: (toolDef as any).jsonSchema || {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        };
        
        if (debug) {
          console.error('[DEBUG] Returning tool:', toolInfo);
        }
        
        return toolInfo;
      })
    };
  });
  
  // Set up tools/call handler
  underlyingServer.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    
    if (debug) {
      console.error(`[DEBUG] Handling tool call: ${name}`, args);
    }
    
    const handler = toolHandlers[name as keyof typeof toolHandlers];
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    // Call the handler with the arguments
    return await handler(args as any, extra as any);
  });
  
  if (debug) {
    console.error('[DEBUG] Tools registered successfully');
  }


  return server;
}