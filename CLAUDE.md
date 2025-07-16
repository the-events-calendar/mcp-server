# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- **Development with hot reload**: `npm run dev`
- **Build TypeScript**: `npm run build`
- **Run compiled server**: `npm start`
- **Quick start**: `bunx @the-events-calendar/mcp-server`

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
