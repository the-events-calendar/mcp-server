# Setting Up MCP with Cursor and Bun

## Prerequisites

1. **Bun**: Fast JavaScript runtime and package manager

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **WordPress Requirements**:
   - A WordPress site with The Events Calendar installed
   - A WordPress application password (different from your login password)

## Installation Steps

1. **Clone and Build the MCP Server**

   ```bash
   git clone https://github.com/the-events-calendar/mcp-server.git
   cd mcp-server
   bun install
   bun run build
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
   3. Under "MCP Tools", choose "New MCP Server" and set up the configuration:

   ```json
   {
     "mcpServers": {
       "events-mcp": {
         "command": "bun",
         "args": ["run", "dev"]
       }
     }
   }
   ```

   > **Note**: This configuration uses Bun to run the development server directly, with hot reload capabilities.

## Verification

1. **Test the Build**

   ```bash
   # Make sure you're in the mcp-server directory
   bun run start
   ```

   You should see output indicating the server is running.

2. **Test Development Mode**

   ```bash
   bun run dev
   ```

   This runs the server in development mode with hot reload.

3. **Test in Cursor**
   1. Restart Cursor to load the new MCP configuration
   2. Try a simple command like checking events or venues

## Benefits of Using Bun

- **Fast Installation**: Bun install is typically faster than npm
- **Native TypeScript**: Direct TypeScript execution without compilation step
- **Hot Reload**: Development mode with automatic restarts
- **Single Runtime**: No need for Node.js version management
- **Better Performance**: Faster startup and execution times

## Development Workflow

### Making Changes

When making changes to the MCP server:

1. Make your code changes
2. Bun's dev mode will automatically reload
3. No need to restart Cursor (unless configuration changes)

### Available Scripts

```bash
# Development with hot reload
bun run dev

# Build for production
bun run build

# Run built version
bun run start

# Build and start
bun run build && bun run start
```

## Troubleshooting

1. **"No server info found" Error**
   - Ensure `bun run build` completed successfully
   - Verify the `dist` folder exists with `index.js`
   - Check your `.env` file is in the correct location

2. **SSL Certificate Errors**
   If using a local WordPress site with self-signed certificates:
   - Add `WP_IGNORE_SSL_ERRORS=true` to your `.env` file
   - Or add to Cursor's env section in the configuration

3. **Bun Version Issues**
   - Check Bun version: `bun --version`
   - Update Bun: `bun upgrade`

4. **Debug Mode**
   - Set `DEBUG=true` in your `.env` file
   - Set `LOG_LEVEL=debug` for more verbose logging
   - Check Cursor's MCP logs for detailed information

## Cursor Configuration Examples

### Basic Development Setup (Recommended)

```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": ["run", "dev"]
    }
  }
}
```

### Production-like Setup

```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": ["run", "start"]
    }
  }
}
```

### With Environment Variables Override

```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "bun",
      "args": ["run", "dev"],
      "env": {
        "WP_URL": "https://your-specific-site.com",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Security Notes

1. Never commit your `.env` file or application passwords
2. Only use `WP_IGNORE_SSL_ERRORS=true` for local development
3. Keep your WordPress application password secure and rotate it regularly
4. Bun respects `.env` files automatically - no additional configuration needed
