# TEC v1 Endpoint Migration Plan

## Overview
This document outlines the plan to migrate from the current WordPress REST API endpoints to the new TEC v1 endpoints.

## Current Endpoints
- Events: `/wp-json/tribe/events/v1/events`
- Venues: `/wp-json/tribe/events/v1/venues`
- Organizers: `/wp-json/tribe/events/v1/organizers`
- Tickets: `/wp-json/tribe/tickets/v1/tickets`

## New Endpoints
- Events: `/wp-json/tec/v1/events`
- Venues: `/wp-json/tec/v1/venues`
- Organizers: `/wp-json/tec/v1/organizers` (Note: PLURAL form, not singular)
- Tickets: `/wp-json/tec/v1/tickets`
- Documentation: `/wp-json/tec/v1/docs`
- Additional endpoints:
  - Calendar Embed: `/wp-json/tec/v1/events/calendar-embed`
  - Event Notices: `/wp-json/tec/v1/events/{id}/notices/occurrences`

## Migration Tasks

### 1. Update Endpoint Configuration Files

#### src/api/endpoints.ts
- Change namespace from `tribe/events` to `tec`
- Change namespace from `tribe/tickets` to `tec`
- Update version to remain `v1`
- Keep organizer resource as `organizers` (plural form)

#### src/wordpress-integrations/angie/tec-mcp-server.ts
- Mirror the same endpoint changes as above

### 2. Response Structure Verification
- Verify if the new API maintains the same response structure
- Check if list responses still wrap data in resource keys
- Ensure authentication headers remain compatible
- **Add required experimental acknowledgement header** (exact header name TBD)

### 3. Post Type Handling
- Post type names remain the same (confirmed):
  - `tribe_events`
  - `tribe_venue`
  - `tribe_organizer`
  - `tribe_rsvp_tickets` / `tec_tc_ticket`

### 4. Documentation Updates
- Update README.md with new endpoint structure
- Update TOOLS_GUIDE.md examples
- Update CLAUDE.md with any architectural changes
- Update any example configurations

### 5. Testing Strategy
- Test each endpoint for:
  - List operations
  - Single item retrieval
  - Create operations
  - Update operations
  - Delete operations
  - Search functionality
- Verify authentication still works
- Check error handling for new error formats

## Potential Breaking Changes
1. ~~Organizer endpoint change from plural to singular~~ (Confirmed: remains plural)
2. Possible response structure changes
3. **NEW: Experimental endpoint acknowledgement required** - The new API returns error code `missing_experimental_endpoint_acknowledgement` with message "Experimental endpoint requires acknowledgement header." Need to determine the exact header name and value.
4. Authentication method changes (if any)
5. Error response format changes

## Rollback Plan
- Keep old endpoint configuration in comments
- Add environment variable to switch between old/new endpoints if needed
- Document any incompatibilities discovered

## Implementation Status
1. ✅ Created migration plan
2. ✅ Updated endpoint configurations in src/api/endpoints.ts
3. ✅ Updated Angie integration endpoints
4. ✅ Added X-TEC-EEA experimental header support
5. ✅ Updated response parsing (arrays returned directly)
6. ⏳ Update documentation
7. ⏳ Full integration testing

## Key Changes Implemented
1. Changed namespace from `tribe/events` and `tribe/tickets` to `tec`
2. Added experimental acknowledgement header: `X-TEC-EEA`
3. Updated response parsing - API now returns arrays directly instead of wrapped in resource keys
4. Removed ListResponse type usage as it's no longer needed