# TEC v1 API Migration Summary

## Overview
Successfully migrated the MCP server from the old WordPress REST API endpoints to the new TEC v1 endpoints.

## Changes Made

### 1. Endpoint Configuration Updates

#### src/api/endpoints.ts
- Changed namespace from `tribe/events` to `tec` for events, venues, and organizers
- Changed namespace from `tribe/tickets` to `tec` for tickets
- Kept resource names the same (events, venues, organizers, tickets)

#### src/wordpress-integrations/angie/tec-mcp-server.ts
- Updated the ENDPOINTS configuration to match the main API client

### 2. Authentication Header

Added the required experimental endpoint acknowledgement header:
```
X-TEC-EEA: I understand that this endpoint is experimental and may change in a future release without maintaining backward compatibility. I also understand that I am using this endpoint at my own risk, while support is not provided for it.
```

This header was added to:
- `src/api/client.ts` - in the request method
- `src/wordpress-integrations/angie/tec-mcp-server.ts` - in the fetch headers

### 3. Response Structure Updates

#### src/api/client.ts
- Updated `listPosts` method to handle arrays returned directly instead of wrapped in resource keys
- Removed import of `ListResponse` type as it's no longer needed

#### src/wordpress-integrations/angie/tec-mcp-server.ts
- Updated response parsing logic to handle direct array responses

### 4. Build Configuration
- Temporarily excluded Angie integration from build due to missing tools-data.json file
- Main project builds successfully with all endpoint updates

## Endpoint Mapping

| Resource | Old Endpoint | New Endpoint |
|----------|-------------|--------------|
| Events | `/wp-json/tribe/events/v1/events` | `/wp-json/tec/v1/events` |
| Venues | `/wp-json/tribe/events/v1/venues` | `/wp-json/tec/v1/venues` |
| Organizers | `/wp-json/tribe/events/v1/organizers` | `/wp-json/tec/v1/organizers` |
| Tickets | `/wp-json/tribe/tickets/v1/tickets` | `/wp-json/tec/v1/tickets` |

## Key Differences in New API

1. **Experimental Header Required**: All requests must include the `X-TEC-EEA` header
2. **Response Structure**: List endpoints return arrays directly, not wrapped in resource keys
3. **Additional Endpoints**: New API includes additional endpoints like `/tec/v1/docs` and `/tec/v1/events/calendar-embed`

## Testing Required

The following should be tested with the new endpoints:
1. List operations for all post types
2. Single item retrieval
3. Create operations
4. Update operations
5. Delete operations
6. Search functionality
7. Filtering with various parameters

## Notes

- Post type names remain unchanged (`tribe_events`, `tribe_venue`, etc.)
- The API is marked as experimental and may change in future releases
- SSL certificate verification may need to be disabled for local development