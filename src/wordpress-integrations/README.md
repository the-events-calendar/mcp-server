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

### Generated Files

After running the build script, you'll find:

- `dist/wordpress/tec-mcp-tools-ai-service.php` - PHP file with tool definitions
- `dist/wordpress/tec-mcp-tools-ai-service.json` - JSON reference file

### PHP File Usage

The generated PHP file provides several functions:

```php
// Get all tool definitions
$tools = tec_get_mcp_tool_definitions();

// Get a specific tool
$tool = tec_get_mcp_tool_definition('tec-calendar-create-update-entities');

// Get tool names
$names = tec_get_mcp_tool_names();
```

### WordPress Integration Example

```php
// In your WordPress plugin
require_once 'path/to/tec-mcp-tools-ai-service.php';

// Register tools with AI Engine
add_filter('ai_engine_tools', function($tools) {
    $mcp_tools = tec_get_mcp_tool_definitions();
    
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

To generate the PHP files:

```bash
# Build all WordPress integrations
npm run build:wp

# Build only AI Service integration
npm run build:wp:ai-service

# Build everything (TypeScript + WordPress)
npm run build:all
```

## Tool Definitions

The tool definitions include:

1. **tec-calendar-create-update-entities** - Create or update events, venues, organizers, and tickets
2. **tec-calendar-read-entities** - Read, list, or search calendar posts
3. **tec-calendar-delete-entities** - Delete calendar posts
4. **tec-calendar-current-datetime** - Get current date/time information

Each tool definition includes:
- `name` - The tool identifier
- `description` - Detailed description with usage examples
- `inputSchema` - JSON Schema defining the tool's parameters

## Adding New Integrations

To add support for a new WordPress AI service:

1. Create a new directory under `wordpress-integrations/`
2. Add a `build.ts` file that generates the appropriate format
3. Import tool definitions from `shared/tool-definitions.ts`
4. Add a new npm script in `package.json`
5. Update this README with usage instructions

## Notes

- The build process extracts tool schemas from the TypeScript MCP server code
- Generated files should not be edited manually - they're overwritten on each build
- The PHP files are designed to be included directly in WordPress plugins
- All tool names follow the `tec-calendar-*` naming convention