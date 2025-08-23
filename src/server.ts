import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ApiClient } from './api/client.js';
import { getToolHandlers, getToolDefinitions } from './tools/index.js';
import { getLogger } from './utils/logger.js';
import { getLocalTimeInfo, getDateOffsets } from './utils/time.js';

function buildInstructions(baseUrl?: string): string {
  const timeInfo = getLocalTimeInfo();
  const dateOffsets = getDateOffsets();

  const lines: string[] = [
    '### The Events Calendar MCP Server Instructions',
    '',
    '**Purpose**: Interact with WordPress posts for Events, Venues, Organizers, and Tickets using the provided tools.',
    '',
  ];

  if (baseUrl) {
    lines.push(
      '### Target Site',
      `- Site URL: ${baseUrl}.`,
      ''
    );
  }

  lines.push(
    '### Time Context (precomputed to avoid extra calls)',
    `- **Local time**: ${timeInfo.datetime} (${timeInfo.timezone}, UTC offset ${timeInfo.timezone_offset})`,
    `- **ISO**: ${timeInfo.iso8601}`,
    '- **Usage hints**:',
    `  - **today_3pm**: ${dateOffsets.todayAt3pm}`,
    `  - **tomorrow_10am**: ${dateOffsets.tomorrowAt10am}`,
    `  - **next_week**: ${dateOffsets.nextWeek}`,
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
  );

  return lines.join('\n');
}

export interface ServerConfig {
  name: string;
  version: string;
  apiClient: ApiClient;
  baseUrl?: string;
}

/**
 * Create and configure the MCP server
 */
export function createServer(config: ServerConfig): McpServer {
  const logger = getLogger();
  
  const server = new McpServer({
    name: config.name,
    version: config.version,
  }, {
    instructions: buildInstructions(config.baseUrl || config.apiClient.getBaseUrl?.()),
    capabilities: {
      tools: {}
    }
  });

  // Get tool handlers and definitions
  const toolHandlers = getToolHandlers(config.apiClient);
  const toolDefinitions = getToolDefinitions();
  
  logger.debug('Tool definitions:', toolDefinitions.map(t => ({
    name: t.name,
    hasInputSchema: !!t.inputSchema,
    hasJsonSchema: !!(t as any).jsonSchema,
    inputSchemaKeys: t.inputSchema ? Object.keys(t.inputSchema) : []
  })));

  // Use the underlying server to set up tools with JSON Schema
  const underlyingServer = (server as any).server as Server;
  
  // Set up tools/list handler
  underlyingServer.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.verbose('Handling tools/list request');
    
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
        
        logger.silly('Returning tool:', toolInfo);
        
        return toolInfo;
      })
    };
  });
  
  // Set up tools/call handler
  underlyingServer.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    
    logger.verbose(`Handling tool call: ${name}`, args);
    
    const handler = toolHandlers[name as keyof typeof toolHandlers];
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    // Call the handler with the arguments
    return await handler(args as any, extra as any);
  });
  
  logger.info('Tools registered successfully');


  return server;
}