# Setting Up MCP with Cursor and Node.js

## Prerequisites

1. Node.js requirements:
   - Option A: Node.js 20+ installed on your system
   - Option B: NVM (Node Version Manager) installed
2. A WordPress site with The Events Calendar installed
3. A WordPress application password (different from your login password)

## Installation Steps

1. **Clone and Build the MCP Server**

   ```bash
   git clone https://github.com/the-events-calendar/mcp-server.git
   cd mcp-server
   npm install
   npm run build
   ```

2. **Create Environment File**
   Create a `.env` file in the mcp-server root directory:

   ```env
   WP_URL=https://your-wordpress-site.com
   WP_USERNAME=your-username
   WP_APP_PASSWORD=your-application-password

   # For local sites with self-signed certificates
   WP_IGNORE_SSL_ERRORS=true

   # Debug
   DEBUG=true

   # Optional logging configuration
   LOG_LEVEL=info
   ```

3. **Configure Cursor**
   1. Open Cursor settings
   2. Navigate to the "Tools and Integrations" section
   3. Under "MCP Tools", choose "New MCP Server" and set up the configuration based on your Node.js setup:

   **Option A: If using Node.js 20+ directly and by default:**

   ```json
   {
     "mcpServers": {
       "events-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/your/mcp-server/dist/index.js"]
       }
     }
   }
   ```

   **Option B: If using NVM or need Node.js version management:**

   ```json
   {
     "mcpServers": {
       "events-mcp": {
         "command": "/absolute/path/to/your/mcp-server/dev/start-node-mcp.sh"
       }
     }
   }
   ```

   > **Important**: Replace `/absolute/path/to/your/mcp-server` with your actual project path
   > - macOS/Linux: e.g., `/Users/YourName/projects/mcp-server`
   > - Windows: e.g., `C:/Users/YourName/projects/mcp-server` or `C:\\Users\\YourName\\projects\\mcp-server`

   > **Important**: If you are working with a local site with a self-signed certificate, set WP_IGNORE_SSL_ERRORS to true to avoid connections issues!

## Verification

1. **Test the Build**

   ```bash
   # Make sure you're in the mcp-server directory
   npm run start
   ```

   You should see output indicating the server is running.

2. **Test in Cursor**
   1. Restart Cursor to load the new MCP configuration
   2. Try a simple command like creating an event

## Troubleshooting

If you encounter issues:

1. **"No server info found" Error**
   - Ensure `npm run build` completed successfully
   - Verify the `dist` folder exists with `index.js`
   - Check your `.env` file is in the correct location
   - Verify all paths in your Cursor configuration are absolute paths

2. **SSL Certificate Errors**
   If using a local WordPress site with self-signed certificates:
   - Add `"WP_IGNORE_SSL_ERRORS": "true"` to your `.env` file, or your Cursor configuration's env section
   - Or use the `--ignore-ssl-errors` command line argument

3. **Debug Mode**
   - All local configuration examples have `DEBUG: "true"` enabled by default
   - Check Cursor's MCP logs for detailed debugging information
   - You can increase verbosity by setting `LOG_LEVEL: "debug"` in the configuration

## Development Workflow

### Node Version Management

The project includes a `start-node-mcp.sh` script that handles Node.js version management for is you regularly switch versions or use a version < 20 by default:

- Automatically loads NVM if available
- Uses the Node.js version specified in `.nvmrc`
- Verifies Node.js 20+ requirement
- Handles proper environment setup

If you're using the script (Option B in configuration):

1. Make sure the script is executable:

   ```bash
   chmod +x start-node-mcp.sh
   ```

2. The script will automatically handle Node.js version requirements

### Making Changes

When making changes to the MCP server:

1. Make your code changes
2. Run `npm run build`
3. Restart Cursor to reload the MCP server

Alternatively, for development, you can use:

```bash
npm run dev
```

This runs the server in watch mode with hot reload.

## Security Notes

1. Never commit your `.env` file or application passwords
2. Only use `WP_IGNORE_SSL_ERRORS=true` for local development
3. Keep your WordPress application password secure and rotate it regularly - especially for publicly accessible sites.
