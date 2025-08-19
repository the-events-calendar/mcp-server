# Migration Guide: Positional to Named Parameters

## Overview

Starting from version 0.2.0, the MCP server uses named parameters instead of positional arguments for better clarity and flexibility.

## What Changed

### Old Format (Deprecated)
```bash
npx -y @the-events-calendar/mcp-server <url> <username> <password> [options]
```

### New Format (Required)
```bash
npx -y @the-events-calendar/mcp-server --url <url> --username <username> --password <password> [options]
```

## Migration Examples

### Basic Usage

**Before:**
```bash
npx -y @the-events-calendar/mcp-server https://mysite.com admin "app_password"
```

**After:**
```bash
npx -y @the-events-calendar/mcp-server \
  --url https://mysite.com \
  --username admin \
  --password "app_password"
```

### With SSL Ignore

**Before:**
```bash
npx -y @the-events-calendar/mcp-server https://mysite.local admin "pass" --ignore-ssl-errors
```

**After:**
```bash
npx -y @the-events-calendar/mcp-server \
  --url https://mysite.local \
  --username admin \
  --password "pass" \
  --ignore-ssl-errors
```

### With Logging

**Before:**
```bash
npx -y @the-events-calendar/mcp-server https://mysite.com admin "pass" --log-level debug --log-file ./mcp.log
```

**After:**
```bash
npx -y @the-events-calendar/mcp-server \
  --url https://mysite.com \
  --username admin \
  --password "pass" \
  --log-level debug \
  --log-file ./mcp.log
```

## Configuration File Updates

### Cursor/Windsurf Configuration

**Before:**
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "https://your-site.com",
        "your-username",
        "your-password"
      ]
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "events-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@the-events-calendar/mcp-server",
        "--url", "https://your-site.com",
        "--username", "your-username",
        "--password", "your-password"
      ]
    }
  }
}
```

## Benefits of Named Parameters

1. **Clarity**: It's immediately clear what each parameter represents
2. **Flexibility**: Parameters can be provided in any order
3. **Optional Parameters**: Easier to skip optional parameters
4. **Future-proof**: New parameters can be added without breaking existing setups
5. **Self-documenting**: Command history is more readable

## Getting Help

To see all available options:
```bash
npx -y @the-events-calendar/mcp-server --help
```

## Environment Variables

Environment variables remain unchanged and work as a fallback when CLI arguments are not provided:
- `WP_URL`
- `WP_USERNAME`
- `WP_APP_PASSWORD`
- `WP_IGNORE_SSL_ERRORS`
- `LOG_LEVEL`
- `LOG_FILE`