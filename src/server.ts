import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ApiClient } from './api/client.js';
import { getToolHandlers, getToolDefinitions } from './tools/index.js';
import { getLocalTime, getServerTime } from './resources/time.js';

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
      tools: {},
      resources: {}
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

  // Set up resources/list handler
  underlyingServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    if (debug) {
      console.error('[DEBUG] Handling resources/list request');
    }
    
    return {
      resources: [
        {
          uri: 'time://local',
          name: 'local-time',
          description: 'Current local time with timezone information',
          mimeType: 'application/json'
        },
        {
          uri: 'time://server',
          name: 'server-time',
          description: 'Current WordPress server time with timezone information',
          mimeType: 'application/json'
        },
        {
          uri: 'info://server',
          name: 'server-info',
          description: 'Information about this MCP server',
          mimeType: 'application/json'
        }
      ]
    };
  });
  
  // Set up resources/read handler
  underlyingServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    if (debug) {
      console.error(`[DEBUG] Handling resource read: ${uri}`);
    }
    
    switch (uri) {
      case 'time://local': {
        const localTime = getLocalTime();
        return {
          contents: [
            {
              uri: 'time://local',
              mimeType: 'application/json',
              text: JSON.stringify(localTime, null, 2)
            }
          ]
        };
      }
      
      case 'time://server': {
        const serverTime = await getServerTime(config.apiClient);
        return {
          contents: [
            {
              uri: 'time://server',
              mimeType: 'application/json',
              text: JSON.stringify(serverTime, null, 2)
            }
          ]
        };
      }
      
      case 'info://server': {
        return {
          contents: [
            {
              uri: 'info://server',
              mimeType: 'application/json',
              text: JSON.stringify({
                name: config.name,
                version: config.version,
                description: 'MCP server for The Events Calendar and Event Tickets',
                supportedPostTypes: ['tribe_events', 'tribe_venue', 'tribe_organizer', 'tribe_rsvp_tickets', 'tec_tc_ticket'],
                tools: toolDefinitions.map(t => ({
                  name: t.name,
                  description: t.description,
                })),
              }, null, 2)
            }
          ]
        };
      }
      
      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  });
  
  if (debug) {
    console.error('[DEBUG] Resources registered successfully');
  }

  return server;
}