import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
  const server = new McpServer({
    name: config.name,
    version: config.version,
  });

  // Get tool handlers and definitions
  const toolHandlers = getToolHandlers(config.apiClient);
  const toolDefinitions = getToolDefinitions();

  // Register each tool
  for (const toolDef of toolDefinitions) {
    const handler = toolHandlers[toolDef.name as keyof typeof toolHandlers];
    
    server.registerTool(
      toolDef.name,
      {
        description: toolDef.description,
        inputSchema: toolDef.inputSchema as any,
      },
      handler as any
    );
  }

  // Add server information resource
  server.registerResource(
    'server-info',
    'info://server',
    {
      title: 'Server Information',
      description: 'Information about this MCP server',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [
        {
          uri: 'info://server',
          text: JSON.stringify({
            name: config.name,
            version: config.version,
            description: 'MCP server for The Events Calendar and Event Tickets',
            supportedPostTypes: ['event', 'venue', 'organizer', 'ticket'],
            tools: toolDefinitions.map(t => ({
              name: t.name,
              description: t.description,
            })),
          }, null, 2),
        },
      ],
    })
  );

  return server;
}