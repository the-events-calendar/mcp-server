# The Events Calendar MCP Server

An MCP (Model Context Protocol) server that provides unified CRUD operations for The Events Calendar and Event Tickets WordPress plugins.

## Features

- **Unified Tools**: Single tools for Create/Update, Read, Delete, and Search operations across all post types
- **Supported Post Types**:
  - Events (`event`)
  - Venues (`venue`)
  - Organizers (`organizer`)
  - Tickets (`ticket`)
- **Full CRUD Operations**: Create, Read, Update, Delete with proper error handling
- **Search Functionality**: Currently supports event search, extensible to other types
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
    "tec-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
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

## Available Tools

### 1. `create_update_post`

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

### 2. `read_post`

Read a single post by ID or list posts with filters.

**Parameters:**
- `postType`: "event" | "venue" | "organizer" | "ticket"
- `id`: (optional) Post ID for single post
- `filters`: (optional) Filtering options
  - `page`: Page number
  - `per_page`: Items per page
  - `search`: Search term
  - `status`: Post status
  - `order`: "asc" | "desc"
  - `orderby`: Field to order by

**Example:**
```json
{
  "postType": "event",
  "filters": {
    "per_page": 10,
    "status": "publish"
  }
}
```

### 3. `delete_post`

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

### 4. `search_posts`

Search for posts by keyword. Currently supports events only.

**Parameters:**
- `postType`: "event" (will be extended)
- `query`: Search string
- `filters`: (optional) Additional filters

**Example:**
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