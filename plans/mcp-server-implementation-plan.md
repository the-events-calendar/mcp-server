# MCP Server for The Events Calendar and Event Tickets

## Architecture Overview

The MCP server will be built using TypeScript and the official MCP SDK, providing unified CRUD operations for Events, Venues, Organizers, and Tickets. The architecture will follow these principles:

1. **Unified Tool Interface**: Single tools for Create/Update, Read, Delete, and Search operations
2. **Post Type Abstraction**: Generic handlers that work with all supported post types
3. **Clear REST API Integration**: Well-defined interfaces to the WordPress REST endpoints
4. **Type Safety**: Full TypeScript support with proper type definitions

## Project Structure

```
/Users/bordoni/stellar/tec/mcp/
├── server/
│   ├── src/
│   │   ├── index.ts                 # Main server entry point
│   │   ├── server.ts                # MCP server setup and configuration
│   │   ├── types/
│   │   │   ├── index.ts             # Main type exports
│   │   │   ├── posts.ts             # Post type definitions
│   │   │   └── api.ts               # API response types
│   │   ├── api/
│   │   │   ├── client.ts            # WordPress REST API client
│   │   │   └── endpoints.ts         # Endpoint configuration
│   │   ├── tools/
│   │   │   ├── index.ts             # Tool registration
│   │   │   ├── create-update.ts     # Unified create/update tool
│   │   │   ├── read.ts              # Unified read tool
│   │   │   ├── delete.ts            # Unified delete tool
│   │   │   └── search.ts            # Unified search tool
│   │   └── utils/
│   │       ├── validation.ts        # Input validation
│   │       └── error-handling.ts    # Error handling utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── client/
    └── (existing BUN client)
```

## Implementation Details

### 1. Unified Tool Definitions

**create_update_post**
- Handles both creation and updates based on presence of ID
- Parameters:
  - `postType`: "event" | "venue" | "organizer" | "ticket"
  - `id?`: Optional ID for updates
  - `data`: Type-specific data object
- Returns: Created/updated post object

**read_post**
- Retrieves single or multiple posts
- Parameters:
  - `postType`: "event" | "venue" | "organizer" | "ticket"
  - `id?`: Optional ID for single post
  - `filters?`: Optional filters for list queries
- Returns: Single post or array of posts

**delete_post**
- Soft deletes posts (moves to trash)
- Parameters:
  - `postType`: "event" | "venue" | "organizer" | "ticket"
  - `id`: Post ID to delete
  - `force?`: Optional force delete flag
- Returns: Deletion confirmation

**search_posts**
- Initially supports Events only, extensible to other types
- Parameters:
  - `postType`: "event" (initially)
  - `query`: Search string
  - `filters?`: Additional search filters
- Returns: Array of matching posts

### 2. REST API Integration

- Configuration-based endpoint mapping
- Environment variables for WordPress site URL and authentication
- Proper error handling and response transformation
- Support for pagination and filtering

### 3. Type System

```typescript
// Base post type
interface BasePost {
  id: number;
  title: string;
  status: string;
  date_created: string;
  date_modified: string;
}

// Specific post types extend base
interface Event extends BasePost {
  start_date: string;
  end_date: string;
  venue?: number;
  organizers?: number[];
  // ... other event-specific fields
}

interface Venue extends BasePost {
  address: string;
  city: string;
  // ... venue-specific fields
}

// Similar for Organizer and Ticket
```

### 4. Configuration

- Environment-based configuration
- Clear endpoint mapping structure
- Easy to update when REST API changes
- Support for custom endpoints

## Development Phases

### Phase 1: Project Setup
- Initialize TypeScript project
- Install MCP SDK and dependencies
- Configure build tools and TypeScript
- Set up basic server structure

### Phase 2: Core Implementation
- Implement base MCP server
- Create unified tool handlers
- Build REST API client
- Implement type system

### Phase 3: Tool Development
- Implement create_update_post tool
- Implement read_post tool
- Implement delete_post tool
- Implement search_posts tool (Events only)

### Phase 4: Testing & Documentation
- Unit tests for tools
- Integration tests with mock API
- Documentation for usage
- Example configurations

## Key Design Decisions

1. **Unified Tools**: Instead of separate tools for each post type, we use a single tool with a `postType` parameter. This reduces complexity and makes the API more consistent.

2. **Configuration-Driven**: Endpoint mappings and post type definitions are configuration-driven, making it easy to adapt to API changes.

3. **Type Safety**: Full TypeScript support ensures type safety across the entire codebase.

4. **Extensibility**: The architecture supports easy addition of new post types or custom endpoints.

5. **Error Handling**: Comprehensive error handling with meaningful error messages for debugging.

This plan provides a solid foundation for building the MCP server while maintaining flexibility for future enhancements and REST API changes.