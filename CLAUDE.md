# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- **Development with hot reload**: `npm run dev`
- **Build TypeScript**: `npm run build`
- **Run compiled server**: `npm start`
- **Quick start**: `npx -y @the-events-calendar/mcp-server --url <url> --username <user> --password <pass>`

### Version Management

**IMPORTANT**: The server version is automatically derived from `package.json` during the build process.

#### To bump the version:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # For bug fixes (0.1.2 -> 0.1.3)
   npm version minor  # For new features (0.1.2 -> 0.2.0)
   npm version major  # For breaking changes (0.1.2 -> 1.0.0)
   ```

2. Build the project to inject the new version:
   ```bash
   npm run build
   ```

3. The version will be automatically injected into `src/version.ts` and `dist/version.js`

**Note**: 
- Never manually edit `src/version.ts` or `dist/version.js` - they are auto-generated
- The `MCP_SERVER_VERSION` environment variable is no longer used
- Version is always read from `package.json` to ensure consistency
- **IMPORTANT**: Never use `v` prefix for version tags (use `0.1.3` not `v0.1.3`)

### Environment Setup

Before development, copy `.env.example` to `.env` and configure:

```bash
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password
```

## Architecture Overview

This is a TypeScript MCP (Model Context Protocol) server for The Events Calendar and Event Tickets WordPress plugins. The architecture follows a unified tool interface pattern where each tool accepts a `postType` parameter instead of having separate tools per post type.

### Key Architectural Decisions

1. **Unified Tool Interface**: All operations (create, read, update, delete, search) work with any supported post type through a single tool with a `postType` parameter. This reduces code duplication and simplifies the API surface.

2. **Type Safety First**: The codebase uses TypeScript with strict mode, Zod for runtime validation, and type-mapped interfaces for each post type. When modifying tools or types, ensure all type constraints are satisfied.

3. **REST API Abstraction**: The `api/client.ts` handles all WordPress REST API communication with proper authentication using Application Passwords. The tools layer should not directly make HTTP requests.

### Project Structure

```text
server/src/
├── index.ts          # Entry point - validates env vars and starts server
├── server.ts         # MCP server registration and tool setup
├── api/              # WordPress REST API integration
├── tools/            # MCP tool implementations (unified interface)
├── types/            # TypeScript definitions for all post types
└── utils/            # Validation schemas and error handling
```

### Supported Post Types

- **Events**: `tribe_events` - The main event post type
- **Venues**: `tribe_venue` - Event locations
- **Organizers**: `tribe_organizer` - Event organizers
- **Tickets**: `tribe_rsvp_tickets` or `tec_tc_ticket` - Event tickets

### Tool Development Guidelines

When modifying or adding tools:

1. All tools use the unified interface pattern with `postType` parameter
2. Input validation uses Zod schemas in `utils/validation.ts`
3. Type definitions for post data are in `types/posts.ts`
4. API endpoints are configured in `api/endpoints.ts`
5. Error handling should provide clear, actionable messages

### Type System

The type system uses a discriminated union pattern for post types:

- `BasePost` contains common fields
- Each post type extends `BasePost` with specific fields
- `PostData` is the discriminated union of all post types
- Use type guards when working with specific post types

### Testing Strategy

Currently, the project has basic build verification. When making changes:

- Ensure TypeScript compilation succeeds with `npm run build`
- Test with a real WordPress instance using `npm run dev`
- Verify all supported post types work with your changes

### SSL Certificate Handling

For local development with self-signed certificates:

- Use `WP_IGNORE_SSL_ERRORS=true` environment variable or `--ignore-ssl-errors` CLI flag
- The server sets `NODE_TLS_REJECT_UNAUTHORIZED=0` internally when SSL errors are ignored
- Uses `undici` library's fetch with a custom Agent configured to bypass certificate checks
- Always show warnings when SSL verification is disabled
- This feature should only be used for local development, never in production

### MCP Tools Usage

When using or testing the MCP tools:

1. **Refer to TOOLS_GUIDE.md** for comprehensive examples and patterns
2. **Date formats are strict**: Events require "YYYY-MM-DD HH:MM:SS" format
3. **All tools use JSON Schema** for input validation (not Zod schemas directly)
4. **Tool names use tec-calendar-* pattern**: tec-calendar-create-update-entities, tec-calendar-read-entities, tec-calendar-delete-entities, tec-calendar-current-datetime

Common tool usage patterns:
- Always check if venues/organizers exist before referencing them in events
- Use tec-calendar-read-entities to list available posts before creating relationships
- The unified tec-calendar-read-entities tool handles single reads, listing, and searching
