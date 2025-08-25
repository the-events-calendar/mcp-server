# WordPress Integrations

This directory contains build scripts and utilities for generating WordPress-compatible MCP tool definitions for various AI services.

## Overview

The MCP (Model Context Protocol) server defines tools for managing The Events Calendar data. To make these tools available to WordPress-based AI services, we need to export the tool definitions in formats that each service can understand.

## Angie Integration

The Angie integration generates a complete MCP (Model Context Protocol) server that implements the Angie SDK interface, ready to handle tool registration and execution.

### Angie Output Format

The build script uses esbuild to create a fully self-contained MCP server for browser use:

- IIFE (Immediately Invoked Function Expression) format for direct browser inclusion
- Complete MCP server implementation with Angie SDK bundled
- Auto-initializes when DOM is ready
- Handles tool listing and tool execution
- Makes REST API calls to WordPress backend
- Fully self-contained - all dependencies bundled (including Angie SDK and MCP SDK)
- Exposes global namespace: `window.TEC_MCP` with `server` and `tools` properties

### JavaScript File Usage

```html
<!-- 1. Include WordPress API settings (required) -->
<script>
window.wpApiSettings = {
    root: '<?php echo esc_url_raw( rest_url() ); ?>',
    nonce: '<?php echo wp_create_nonce( 'wp_rest' ); ?>'
};
</script>

<!-- 2. Include the MCP server (self-contained, includes Angie SDK) -->
<script src="tec-mcp-server.js"></script>

<!-- The server auto-initializes and registers with Angie -->
<!-- Access via: window.TEC_MCP.server and window.TEC_MCP.tools -->
```

### MCP Server Features

The generated MCP server includes:

- **Automatic registration** with Angie SDK on page load
- **Tool listing handler** that returns all TEC tools
- **Tool execution handler** that calls your WordPress REST API
- **Error handling** for missing API settings or failed requests
- **Debug access** via `window.TEC_MCP.server` and `window.TEC_MCP.tools`
- **Manual initialization** available via `window.TEC_MCP.initialize()`

## Building

### Prerequisites

Before using the build commands, ensure the TypeScript code is compiled:

```bash
# Build TypeScript first
npm run build

# Or build everything at once
npm run build:all
```

### Using NPX (Recommended for Production)

After installing the package, you can generate PHP files for different integrations:

```bash
# AI Service integration
npx @the-events-calendar/mcp-server tec-mcp-build-wp > path/to/ai-service-tools.php

# Angie integration (MCP server)
npx @the-events-calendar/mcp-server tec-mcp-build-wp-angie path/to/tec-mcp-server.js
npx @the-events-calendar/mcp-server tec-mcp-build-wp-angie --output path/to/tec-mcp-server.js
npx @the-events-calendar/mcp-server tec-mcp-build-wp-angie --minify path/to/tec-mcp-server.min.js

# Examples:
npx @the-events-calendar/mcp-server tec-mcp-build-wp > wp-content/plugins/my-plugin/includes/tec-mcp-tools.php
npx @the-events-calendar/mcp-server tec-mcp-build-wp-angie wp-content/plugins/my-plugin/assets/js/tec-mcp-server.js
npx @the-events-calendar/mcp-server tec-mcp-build-wp-angie --minify wp-content/plugins/my-plugin/assets/js/tec-mcp-server.min.js
```

### Using NPM Scripts (For Development)

When developing locally, you can use npm scripts:

```bash
# AI Service integration
npm run build:wp:ai-service > my-ai-integration.php

# Angie integration (MCP server)
npm run build:wp:angie -- my-tec-mcp-server.js
npm run build:wp:angie -- --output my-tec-mcp-server.js
npm run build:wp:angie -- --minify my-tec-mcp-server.min.js
npm run build:wp:angie -- -m -o my-tec-mcp-server.min.js

# Build everything (TypeScript + all integrations)
npm run build:all
```

## Tool Definitions

The generated PHP file includes all MCP tools:

1. **tec-calendar-create-update-entities** - Create or update events, venues, organizers, and tickets
   - Supports both creation (without ID) and updates (with ID)
   - Handles all post types: event, venue, organizer, ticket
   - Includes date/time handling guidance

2. **tec-calendar-read-entities** - Read, list, or search calendar posts
   - Get single post by ID
   - List all posts of a type
   - Search posts by keyword
   - Supports all query parameters from WordPress REST API

3. **tec-calendar-delete-entities** - Delete calendar posts
   - Permanently removes posts by ID
   - Works with all supported post types

 

Each tool definition includes:

- `name` - The tool identifier (follows `tec-calendar-*` pattern)
- `description` - Detailed description with usage examples and important notes
- `inputSchema` - JSON Schema defining the tool's parameters

## Adding New Integrations

To add support for a new WordPress AI service:

1. Create a new directory under `wordpress-integrations/`
2. Add a `build.ts` file that generates the appropriate format
3. Import tool definitions from `shared/tool-definitions.ts`
4. Add a new npm script in `package.json`
5. Update this README with usage instructions

## Important Notes

- **Build Order**: Always run `npm run build` before generating WordPress integrations
- **Output Method**: The build script outputs to stdout - always pipe to a file
- **No Intermediate Files**: Unlike some build processes, this doesn't create files in `dist/wordpress/`
- **Direct Inclusion**: The generated PHP file can be directly included or required in WordPress
- **Auto-generated Warning**: The PHP file includes a header warning not to edit manually
- **Tool Naming**: All tool names follow the `tec-calendar-*` pattern for consistency
 

## Troubleshooting

### Command not found

If `npx @the-events-calendar/mcp-server tec-mcp-build-wp` doesn't work:

1. Ensure the package is properly installed
2. Run `npm run build` first to compile TypeScript
3. Use the npm script as an alternative: `npm run build:wp:ai-service`

### Empty output

If the build command produces no output:

1. Check for TypeScript compilation errors
2. Ensure all dependencies are installed with `npm install`
3. Try running `npm run build:all` to rebuild everything
