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

# Optional: For local sites with self-signed certificates
WP_IGNORE_SSL_ERRORS=true
```

> **Note**: Only use `WP_IGNORE_SSL_ERRORS=true` for local development with self-signed certificates. This internally sets `NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass Node.js TLS validation.

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

For local sites with SSL certificate issues, add the flag:
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": [
        "/path/to/your/project/dist/index.js",
        "https://your-site.local",
        "your-username",
        "your-application-password",
        "--ignore-ssl-errors"
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

### Option 2: Direct Execution (Recommended for MCP)
The local configuration examples use direct execution to avoid npm output interference:

#### Using Node.js (default)
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js"],
      "env": {
        "WP_URL": "https://your-wordpress-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-application-password",
        "DEBUG": "true"
      }
    }
  }
}
```

#### Using Bun
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": ["run", "/path/to/your/project/dist/index.js"],
      "env": {
        "WP_URL": "https://your-wordpress-site.com",
        "WP_USERNAME": "your-username",
        "WP_APP_PASSWORD": "your-application-password",
        "DEBUG": "true"
      }
    }
  }
}
```

### Available Scripts (for manual testing)
- `npm run start` - Run with Node.js
- `npm run start:bun` - Run with Bun
- `npm run start:debug` - Run with Bun and save debug logs to `debug.log`
- `npm run dev` - Watch mode with hot reload

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

### SSL Certificate Errors

For local WordPress sites with self-signed certificates, you'll see "unable to verify the first certificate" errors. To fix this:

1. Add `WP_IGNORE_SSL_ERRORS` to your environment:
   ```json
   {
     "env": {
       "WP_URL": "https://mysite.local",
       "WP_USERNAME": "admin",
       "WP_APP_PASSWORD": "password",
       "WP_IGNORE_SSL_ERRORS": "true"
     }
   }
   ```

2. Or use command-line arguments:
   ```json
   {
     "args": [
       "/path/to/dist/index.js",
       "https://mysite.local",
       "admin",
       "password",
       "--ignore-ssl-errors"
     ]
   }
   ```

**Technical Details:** The server sets `NODE_TLS_REJECT_UNAUTHORIZED=0` when SSL errors are ignored, which tells Node.js to skip certificate validation. This is combined with a custom HTTP agent configured to bypass certificate checks.

### Debugging

#### Debug Mode
All local configuration examples have `DEBUG: "true"` enabled, which provides detailed logging:
- Process arguments
- Configuration values (with sensitive data masked)
- Server initialization steps
- MCP communication readiness

Debug logs are written to stderr, which appears in your AI editor's MCP logs.

#### Manual Debugging
To see debug output in terminal:
```bash
DEBUG=true bun dist/index.js
```

Or use the debug script to save logs:
```bash
npm run start:debug
# Check debug.log for output
```

#### Common Debug Points
1. **Module Loading Issues**: The delay before transport initialization helps avoid Bun module output
2. **Configuration Problems**: Debug mode shows what credentials are being used
3. **Connection Issues**: Debug logs show each step of server initialization

## Updating Configuration Paths

Remember to update the absolute paths in the configuration files:
1. Find: `/path/to/your/mcp-server`
2. Replace with: Your actual project path

### Path Examples
- macOS/Linux: `/Users/YourName/projects/mcp-server`
- Windows: `C:/Users/YourName/projects/mcp-server` or `C:\\Users\\YourName\\projects\\mcp-server`