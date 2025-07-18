# Local Development Setup

This guide explains how to use your local development version of the MCP server with various AI-powered code editors.

## Prerequisites

1. Build the project first:
```bash
npm install
npm run build
```

2. Note your project's absolute path and replace `/path/to/your/mcp-server` in the configuration files with your actual project path.

## Configuration Files

### Using Environment Variables
The `-local.json` files use environment variables for credentials:
- `claude-desktop-config-local.json`
- `cursor-config-local.json`
- `windsurf-config-local.json`

### Using .env File
Make sure you have a `.env` file in your project root with:
```env
WP_URL=https://your-wordpress-site.com
WP_USERNAME=your-username
WP_APP_PASSWORD=your-application-password
```

### Using Command-Line Arguments
You can also modify the configuration to pass arguments directly:
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": [
        "/path/to/your/project/dist/index.js",
        "https://your-wordpress-site.com",
        "your-username",
        "your-application-password"
      ]
    }
  }
}
```

## Development Workflow

### Option 1: Build and Run
1. Make your code changes
2. Build the project: `npm run build`
3. Restart your AI editor to reload the MCP server

### Option 2: Watch Mode (Recommended)
1. In one terminal, run: `npm run dev`
2. In your configuration, change the command to use the TypeScript files directly:
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": ["/path/to/your/project/src/index.ts"],
      "env": {
        "WP_URL": "https://your-wordpress-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

## Troubleshooting

### "No server info found" Error
This error typically occurs when:
1. The build hasn't completed successfully
2. The path to `dist/index.js` is incorrect
3. The environment variables aren't being loaded

To fix:
1. Ensure `npm run build` completes without errors
2. Verify the `dist` folder exists and contains `index.js`
3. Check that your `.env` file is in the project root

### Permission Errors
If you get permission errors, make sure the built file is executable:
```bash
chmod +x dist/index.js
```

### Debugging
To see debug output, you can run the server manually:
```bash
bun dist/index.js
```

This will show any startup errors or missing environment variables.

Or run the TypeScript file directly with Bun:
```bash
bun src/index.ts
```

## Updating Configuration Paths

Remember to update the absolute paths in the configuration files:
1. Find: `/path/to/your/mcp-server`
2. Replace with: Your actual project path

### Path Examples
- macOS/Linux: `/Users/YourName/projects/mcp-server`
- Windows: `C:/Users/YourName/projects/mcp-server` or `C:\\Users\\YourName\\projects\\mcp-server`