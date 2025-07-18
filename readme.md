# The Events Calendar MCP Server

An MCP (Model Context Protocol) server that provides unified CRUD operations for The Events Calendar and Event Tickets WordPress plugins.

## Quick Start

### Option 1: Using Command-Line Arguments
Run directly with bunx and provide credentials as arguments:
```bash
bunx @the-events-calendar/mcp-server <wordpress-url> <username> <application-password>
```

Example:
```bash
bunx @the-events-calendar/mcp-server https://mysite.com myuser myapp-pass-word
```

### Option 2: Using Environment Variables
Set up environment variables and run without arguments:
```bash
bunx @the-events-calendar/mcp-server
```

## Features

- **Unified Tools**: Single tools for Create/Update, Read (with search), and Delete operations across all post types
- **Supported Post Types**:
  - Events (`event`)
  - Venues (`venue`)
  - Organizers (`organizer`)
  - Tickets (`ticket`)
- **Full CRUD Operations**: Create, Read, Update, Delete with proper error handling
- **Search Functionality**: Integrated into read tool, supports all post types
- **Type Safety**: Full TypeScript support with proper type definitions

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

> **Note**: See the [examples directory](./examples) for ready-to-use configuration files for Claude Desktop, Cursor, and Windsurf.

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

### Option 2: MCP Configuration File (for Claude Desktop)

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bunx",
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

## Usage

### Running with Command-Line Arguments

You can pass WordPress credentials directly as command-line arguments:
```bash
npx @the-events-calendar/mcp-server <wordpress-url> <username> <application-password>
```

Example:
```bash
npx @the-events-calendar/mcp-server https://example.com admin x1y2z3a4b5c6
```

### Development Mode

Run the server in watch mode (requires environment variables):
```bash
npm run dev
```

### Production Mode

Build and run (requires environment variables):
```bash
npm run build
npm start
```

## Available Tools

> **📚 Comprehensive Guide**: For detailed examples and best practices, see the [Tools Guide](./TOOLS_GUIDE.md)

### 1. `calendar_create_update`

Create or update a post. If an ID is provided, it updates; otherwise, it creates.

**Parameters:**
- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: (optional) Post ID for updates
- `data`: Post data object (fields depend on post type)

**Example:**
```json
{
  "postType": "event",
  "data": {
    "title": "My Event",
    "start_date": "2024-12-25 10:00:00",
    "end_date": "2024-12-25 18:00:00",
    "venue": 123
  }
}
```

### 2. `calendar_read`

Read a single post by ID, list posts, or search posts by query. Supports all post types.

**Parameters:**
- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: (optional) Post ID for single post retrieval
- `query`: (optional) Search query string
- `filters`: (optional) Filtering and search options
  - `page`: Page number
  - `per_page`: Items per page
  - `search`: Search term (deprecated - use top-level `query` instead)
  - `status`: Post status
  - `order`: "asc" | "desc"
  - `orderby`: Field to order by
  - `include`: Array of specific IDs to include
  - `exclude`: Array of specific IDs to exclude
  - Event-specific filters:
    - `start_date`: Filter by event start date
    - `end_date`: Filter by event end date
    - `venue`: Filter by venue ID
    - `organizer`: Filter by organizer ID

**Examples:**

Read a single post:
```json
{
  "postType": "event",
  "id": 123
}
```

List all posts:
```json
{
  "postType": "venue",
  "filters": {
    "per_page": 10,
    "status": "publish"
  }
}
```

Search posts:
```json
{
  "postType": "event",
  "query": "conference",
  "filters": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-31"
  }
}
```

### 3. `calendar_delete`

Delete a post (soft delete to trash or permanent delete).

**Parameters:**
- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: Post ID to delete
- `force`: (optional) true for permanent delete, false for trash

**Example:**
```json
{
  "postType": "event",
  "id": 123,
  "force": false
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
- `MCP_SERVER_NAME`: (optional) Server name, defaults to "tec-mcp-server"
- `MCP_SERVER_VERSION`: (optional) Server version, defaults to "1.0.0"

## Development

### Project Structure

```
├── src/
│   ├── api/          # WordPress REST API client
│   ├── tools/        # MCP tool implementations
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   ├── server.ts     # MCP server setup
│   └── index.ts      # Entry point
├── dist/             # Compiled JavaScript (generated)
├── package.json
└── tsconfig.json
```

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

All errors are formatted consistently and include status codes when available.

## License

ISC