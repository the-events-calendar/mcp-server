# MCP Server Configuration Examples

This directory contains configuration examples for various AI-powered code editors that support the Model Context Protocol (MCP).


## Getting WordPress Application Password

1. Log in to your WordPress admin dashboard
2. Navigate to Users → Your Profile
3. Scroll to "Application Passwords" section
4. Enter a name for the application (e.g., "MCP Server")
5. Click "Add New Application Password"
6. Copy the generated password (spaces can be included)

## Configuration Files

### Cursor
- `cursor-config.json` - Uses environment variables for credentials
- `cursor-config-with-args.json` - Uses command-line arguments for credentials
- `cursor-config-local.json` - Local development with Node.js
- `cursor-config-local-bun.json` - Local development with Bun

### Windsurf
- `windsurf-config.json` - Uses environment variables for credentials
- `windsurf-config-with-args.json` - Uses command-line arguments for credentials
- `windsurf-config-local.json` - Local development with Node.js

### Local Development
- `local-development.md` - Guide for using your local development version

## Setup Instructions

### Cursor

1. Open Cursor settings
2. Navigate to the MCP servers configuration
3. Copy the contents of your chosen configuration file
4. Replace the placeholder values with your WordPress credentials
5. Save the configuration

### Windsurf

1. Open Windsurf settings
2. Navigate to the MCP configuration section
3. Copy the contents of your chosen configuration file
4. Replace the placeholder values with your WordPress credentials
5. Save the configurationw

## Choosing Between Environment Variables and Command-Line Arguments

### Environment Variables Configuration

Use the standard configuration files (without `-with-args` suffix) when:

- You want to keep credentials secure in environment variables
- You're using a shared configuration
- You prefer not to expose credentials in the configuration file

### Command-Line Arguments Configuration

Use the `-with-args` configuration files when:

- You want a simpler setup without environment variables
- You're comfortable storing credentials in the configuration file
- You're using a local development environment

## Security Notes

- Never commit configuration files with real credentials to version control
- Use strong application passwords generated from WordPress
- Consider using environment variables for production environments
- Regularly rotate your application passwords
