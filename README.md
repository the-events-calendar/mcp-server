# The Events Calendar MCP Server

An MCP (Model Context Protocol) server that provides unified CRUD operations for The Events Calendar and Event Tickets WordPress plugins.

## Quick Start

Run directly with npx or bunx (no installation required):
```bash
npx @the-events-calendar/mcp-server
# or
bunx @the-events-calendar/mcp-server
```

## Features

- **Unified Tools**: Single tools for Create/Update, Read, Delete, and Search operations across all post types
- **Supported Post Types**:
  - Events (`tribe_events`)
  - Venues (`tribe_venue`)
  - Organizers (`tribe_organizer`)
  - Tickets (`tribe_rsvp_tickets` or `tec_tc_ticket`)
- **Full CRUD Operations**: Create, Read, Update, Delete with proper error handling
- **Search Functionality**: Integrated search via the read tool with query parameter
- **Nested Creation**: Create venues and organizers inline when creating events
- **Type Safety**: Full TypeScript support with proper type definitions
- **Time Resources**: Access local and server time with timezone information
- **MCP Resources**: Provides server info and time data through resource URIs

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

3. Configure the server using one of these methods:

### Option 1: Environment Variables (for development)

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env` with your WordPress credentials:
```env
WP_URL=https://your-wordpress-site.com
WP_USERNAME=your-username
WP_APP_PASSWORD=your-application-password
```

### Option 2: MCP Configuration File

For different MCP clients, add to your configuration file:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": ["@the-events-calendar/mcp-server"],
      "env": {
        "WP_URL": "https://your-wordpress-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

**For local development with SSL issues**, add:
```json
{
  "mcpServers": {
    "tec-mcp": {
      "command": "npx",
      "args": ["@the-events-calendar/mcp-server", "--ignore-ssl-errors"],
      "env": {
        "WP_URL": "https://your-local-site.test",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

See the `examples/` directory for configuration examples for Cursor, Windsurf, and other MCP clients.

## Usage

### Development Mode

Run the server in watch mode:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

### Alternative Runtimes

Run with Bun:
```bash
npm run start:bun
```

Run with debug output:
```bash
npm run start:debug
```

### Local Development with Self-Signed Certificates

For local WordPress sites using self-signed SSL certificates:

1. Use the `--ignore-ssl-errors` CLI flag:
```bash
npx @the-events-calendar/mcp-server --ignore-ssl-errors
```

2. Or set the environment variable:
```bash
WP_IGNORE_SSL_ERRORS=true npx @the-events-calendar/mcp-server
```

**⚠️ Warning**: Only use SSL bypass for local development. Never disable SSL verification in production.

## Available Tools

### 1. `calendar_create_update_entity`

Create or update a post. If an ID is provided, it updates; otherwise, it creates.

**Parameters:**
- `postType`: "tribe_events" | "tribe_venue" | "tribe_organizer" | "tribe_rsvp_tickets" | "tec_tc_ticket"
- `id`: (optional) Post ID for updates
- `data`: Post data object (fields depend on post type)

**Example - Create Event:**
```json
{
  "postType": "tribe_events",
  "data": {
    "title": "My Event",
    "start_date": "2024-12-25 10:00:00",
    "end_date": "2024-12-25 18:00:00",
    "venue": 123
  }
}
```

**Example - Create Event with Nested Venue:**
```json
{
  "postType": "tribe_events",
  "data": {
    "title": "Conference 2024",
    "start_date": "2024-12-25 10:00:00",
    "end_date": "2024-12-25 18:00:00",
    "venue": {
      "venue": "Convention Center",
      "address": "123 Main St",
      "city": "New York",
      "state_province": "NY",
      "zip": "10001",
      "country": "US"
    }
  }
}
```

### 2. `calendar_read_entity`

Read a single post by ID or list posts with filters.

**Parameters:**
- `postType`: "tribe_events" | "tribe_venue" | "tribe_organizer" | "tribe_rsvp_tickets" | "tec_tc_ticket"
- `id`: (optional) Post ID for single post
- `query`: (optional) Search term
- Common filters (all post types):
  - `page`: Page number
  - `per_page`: Items per page (max 100 by default)
  - `status`: Post status
  - `order`: "asc" | "desc"
  - `orderby`: Field to order by
  - `include`: Array of specific IDs to include
  - `exclude`: Array of specific IDs to exclude
- `eventFilters`: (optional) Event-specific filters
  - `start_date`: Events starting after this date
  - `end_date`: Events ending before this date
  - `venue`: Filter by venue ID
  - `organizer`: Filter by organizer ID

**Example - List Events:**
```json
{
  "postType": "tribe_events",
  "per_page": 10,
  "status": "publish",
  "eventFilters": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-31"
  }
}
```

**Example - Search Events:**
```json
{
  "postType": "tribe_events",
  "query": "conference",
  "per_page": 20
}
```

### 3. `calendar_delete_entity`

Delete a post (soft delete to trash or permanent delete).

**Parameters:**
- `postType`: "tribe_events" | "tribe_venue" | "tribe_organizer" | "tribe_rsvp_tickets" | "tec_tc_ticket"
- `id`: Post ID to delete
- `force`: (optional) true for permanent delete, false for trash

**Example:**
```json
{
  "postType": "tribe_events",
  "id": 123,
  "force": false
}
```

### 4. Search Functionality

Search is integrated into the `calendar_read_entity` tool using the `query` parameter.

**Example:**
```json
{
  "postType": "tribe_events",
  "query": "conference",
  "eventFilters": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-31"
  }
}
```

## Available Resources

### 1. `time://local`

Provides current local time with timezone information.

**Returns:**
```json
{
  "datetime": "2024-12-19 14:30:45",
  "timestamp": 1734620445,
  "timezone": "America/New_York",
  "timezone_offset": "-05:00",
  "date": "2024-12-19",
  "time": "14:30:45",
  "iso8601": "2024-12-19T19:30:45.000Z",
  "utc_datetime": "2024-12-19 19:30:45",
  "utc_offset_seconds": 18000
}
```

### 2. `time://server`

Provides current WordPress server time with timezone information.

**Returns:**
```json
{
  "datetime": "2024-12-19 19:30:45",
  "timestamp": 1734620445,
  "timezone": "UTC",
  "timezone_offset": "+00:00",
  "date": "2024-12-19",
  "time": "19:30:45",
  "iso8601": "2024-12-19T19:30:45.000Z",
  "utc_datetime": "2024-12-19 19:30:45",
  "utc_offset_seconds": 0
}
```

**Note:** Server timezone is determined from WordPress settings. If settings are not accessible, falls back to local time.

### 3. `info://server`

Provides information about the MCP server itself.

**Returns:**
```json
{
  "name": "tec-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for The Events Calendar and Event Tickets",
  "supportedPostTypes": [
    "tribe_events",
    "tribe_venue",
    "tribe_organizer",
    "tribe_rsvp_tickets",
    "tec_tc_ticket"
  ],
  "tools": [
    {
      "name": "calendar_create_update_entity",
      "description": "Create or update calendar entities"
    },
    {
      "name": "calendar_read_entity",
      "description": "Read calendar entities"
    },
    {
      "name": "calendar_delete_entity",
      "description": "Delete calendar entities"
    }
  ]
}
```

## Authentication

This server requires WordPress Application Passwords for authentication. To create one:

1. Log in to your WordPress admin
2. Go to Users → Your Profile
3. Scroll to "Application Passwords"
4. Enter a name and click "Add New Application Password"
5. Copy the generated password (spaces can be included)

## Environment Variables

- `WP_URL`: Your WordPress site URL
- `WP_USERNAME`: WordPress username
- `WP_APP_PASSWORD`: Application password
- `WP_IGNORE_SSL_ERRORS`: (optional) Set to "true" for local development with self-signed certificates
- `WP_ENFORCE_PER_PAGE_LIMIT`: (optional) Set to "false" to disable the 100 item per_page limit
- `MCP_SERVER_NAME`: (optional) Server name, defaults to "tec-mcp-server"
- `MCP_SERVER_VERSION`: (optional) Server version, defaults to "1.0.0"

## Development

### Project Structure

```
├── src/
│   ├── api/          # WordPress REST API client
│   ├── tools/        # MCP tool implementations
│   ├── types/        # TypeScript type definitions
│   │   └── schemas/  # Zod validation schemas
│   ├── utils/        # Utility functions
│   ├── server.ts     # MCP server setup
│   └── index.ts      # Entry point
├── examples/         # Configuration examples for various MCP clients
├── dist/             # Compiled JavaScript (generated)
├── TOOLS_GUIDE.md    # Detailed tool documentation
├── package.json
└── tsconfig.json
```

This project uses ES modules (`"type": "module"` in package.json).

### Adding New Post Types

1. Add the type definition in `src/types/posts.ts`
2. Update the endpoint configuration in `src/api/endpoints.ts`
3. Add validation schema in `src/utils/validation.ts`
4. Update tool schemas if needed

## Error Handling

The server provides detailed error messages for:
- Authentication failures
- Invalid post types
- Missing required fields
- API errors from WordPress
- Date format errors (must be "YYYY-MM-DD HH:MM:SS")
- SSL certificate errors (with helpful guidance)

All errors are formatted consistently and include status codes when available.

## Important Notes

### Date Format
All date fields must use the format: `"YYYY-MM-DD HH:MM:SS"` (e.g., "2024-12-25 10:00:00")

### Per-Page Limits
By default, the API limits results to 100 items per page. To disable this limit:
- Set `WP_ENFORCE_PER_PAGE_LIMIT=false` in your environment
- Or use smaller `per_page` values in your requests

### Post Type Names
Use the full WordPress post type names:
- Events: `tribe_events`
- Venues: `tribe_venue`
- Organizers: `tribe_organizer`
- Tickets: `tribe_rsvp_tickets` or `tec_tc_ticket`

## Additional Resources

- [TOOLS_GUIDE.md](./TOOLS_GUIDE.md) - Comprehensive guide with examples for all tools
- [examples/](./examples/) - Configuration examples for various MCP clients
- [GitHub Issues](https://github.com/the-events-calendar/mcp-server/issues) - Report bugs or request features

## License

ISC