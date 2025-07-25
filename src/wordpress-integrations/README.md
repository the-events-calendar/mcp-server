# WordPress Integrations

This directory contains build scripts and utilities for generating WordPress-compatible MCP tool definitions for various AI services.

## Overview

The MCP (Model Context Protocol) server defines tools for managing The Events Calendar data. To make these tools available to WordPress-based AI services, we need to export the tool definitions in formats that each service can understand.

## Structure

```
wordpress-integrations/
├── ai-service/           # AI Engine integration
│   └── build.ts         # Generates PHP file for AI Engine
├── shared/              # Shared utilities
│   └── tool-definitions.ts  # Extracts tool schemas from MCP
└── README.md           # This file
```

## AI Service Integration

The AI Service integration generates a PHP file that can be included in WordPress plugins to register MCP tools with AI Engine or similar services.

### Generated Output

The build script outputs PHP code directly to stdout, allowing you to save it to any location. The PHP file contains:

- Auto-generated header with timestamp
- Embedded JSON with all MCP tool definitions
- Direct return statement providing tool definitions as an array

### PHP File Usage

The generated PHP file directly returns an array of tool definitions when included:

```php
// Include the generated file to get tool definitions
$tools = include 'path/to/tec-mcp-tools.php';

// The $tools variable now contains an array of all tool definitions
foreach ($tools as $tool) {
    echo $tool['name'] . ': ' . $tool['description'] . "\n";
}
```

### WordPress Integration Example

```php
// In your WordPress plugin
$mcp_tools = include 'path/to/tec-mcp-tools.php';

// Register tools with AI Engine
add_filter('ai_engine_tools', function($tools) use ($mcp_tools) {
    foreach ($mcp_tools as $tool) {
        $tools[] = [
            'id' => $tool['name'],
            'name' => $tool['name'],
            'description' => $tool['description'],
            'parameters' => $tool['inputSchema'],
            'handler' => 'tec_handle_' . str_replace('-', '_', $tool['name'])
        ];
    }
    
    return $tools;
});
```

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

After installing the package, you can generate the PHP file directly:

```bash
# Output to stdout (pipe to any file)
npx @the-events-calendar/mcp-server tec-mcp-build-wp > path/to/your/file.php

# Example: Generate into a WordPress plugin
npx @the-events-calendar/mcp-server tec-mcp-build-wp > wp-content/plugins/my-plugin/includes/tec-mcp-tools.php
```

### Using NPM Scripts (For Development)

When developing locally, you can use npm scripts:

```bash
# Output to stdout
npm run build:wp:ai-service

# Save to a specific file
npm run build:wp:ai-service > my-integration.php

# Build everything (TypeScript + WordPress integrations)
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

4. **tec-calendar-current-datetime** - Get current date/time information
   - Returns server time, timezone, and formatted dates
   - Essential for creating events with relative dates

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
- **Date Handling**: The current-datetime tool should be called before creating events with relative dates

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
