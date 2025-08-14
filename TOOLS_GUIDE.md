# MCP Calendar Tools Guide

This guide provides comprehensive examples and best practices for using The Events Calendar MCP tools. These tools allow you to create, read, update, delete, and search calendar posts in WordPress.

## Overview

The MCP server provides three main tools:
- `tec-calendar-create-update-entities` - Create new posts or update existing ones
- `tec-calendar-read-entities` - Read, list, or search posts
- `tec-calendar-delete-entities` - Delete posts (trash or permanent)
- `tec-calendar-current-datetime` - Get current date and time information

All tools support four post types:
- `event` - Calendar events
- `venue` - Event locations
- `organizer` - Event organizers
- `ticket` - Event tickets

## Tool Usage Examples

### 1. tec-calendar-create-update-entities

This tool creates new posts or updates existing ones. If you provide an `id`, it updates; otherwise, it creates.

#### Creating an Event

```json
{
  "postType": "event",
  "data": {
    "title": "Summer Music Festival",
    "start_date": "2024-07-20 15:00:00",
    "end_date": "2024-07-20 23:00:00",
    "description": "Annual outdoor music festival featuring local bands",
    "venue": 42,
    "organizer": 15,
    "url": "https://example.com/summer-fest",
    "cost": "$45",
    "all_day": false,
    "status": "publish"
  }
}
```

**Important Date Format**: Events require dates in `YYYY-MM-DD HH:MM:SS` format (24-hour time).

#### Creating a Venue

```json
{
  "postType": "venue",
  "data": {
    "venue": "Madison Square Garden",
    "address": "4 Pennsylvania Plaza",
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "zip": "10001",
    "phone": "(212) 465-6741",
    "website": "https://www.msg.com",
    "status": "publish"
  }
}
```

#### Creating an Organizer

```json
{
  "postType": "organizer",
  "data": {
    "organizer": "Live Nation Entertainment",
    "phone": "(310) 867-7000",
    "website": "https://www.livenation.com",
    "email": "info@livenation.com",
    "status": "publish"
  }
}
```

#### Creating a Ticket

**Important**: Tickets MUST be associated with an event. The `event` or `event_id` field is required.

```json
{
  "postType": "ticket",
  "data": {
    "title": "General Admission",
    "event_id": 123,
    "price": 49.99,
    "stock": 100,
    "manage_stock": true,
    "status": "publish"
  }
}
```

**Automatic Defaults**:
- `provider` defaults to "Tickets Commerce" (the preferred ticketing system)
- `start_date` defaults to 1 week before the event start date
- `end_date` defaults to the event start date
- You can override any of these defaults by providing explicit values

**⚠️ Important**: The `start_date` and `end_date` fields are soft requirements. While they're automatically set to sensible defaults, they control when tickets are available for sale. **Tickets will not be displayed or available for purchase outside of these dates.**

**Advanced Ticket Example**:
```json
{
  "postType": "ticket",
  "data": {
    "title": "VIP Experience",
    "event_id": 123,
    "price": 150.00,
    "sale_price": 120.00,
    "sale_price_start_date": "2025-02-01",
    "sale_price_end_date": "2025-02-28",
    "description": "Premium VIP package",
    "stock": 30,
    "manage_stock": true,
    "show_description": true,
    "start_date": "2025-01-15 10:00:00",
    "end_date": "2025-03-15 23:59:59",
    "sku": "VIP-2025-001",
    "status": "publish"
  }
}
```

#### Updating an Existing Post

To update, include the `id` field:

```json
{
  "postType": "event",
  "id": 123,
  "data": {
    "title": "Summer Music Festival 2024 (Updated)",
    "start_date": "2024-07-21 14:00:00"
  }
}
```

### 2. tec-calendar-read-entities

This versatile tool can read single posts, list multiple posts, or search posts.

#### Get a Single Post by ID

```json
{
  "postType": "event",
  "id": 123
}
```

#### List All Posts of a Type

```json
{
  "postType": "venue",
  "per_page": 20,
  "page": 1,
  "status": "publish",
  "order": "desc",
  "orderby": "date"
}
```

#### Search Posts by Query

```json
{
  "postType": "event",
  "query": "music festival",
  "per_page": 10,
  "status": "publish"
}
```

#### Filter Events by Date Range

```json
{
  "postType": "event",
  "eventFilters": {
    "start_date": "2024-07-01",
    "end_date": "2024-07-31"
  },
  "status": "publish"
}
```

#### Filter Events by Venue or Organizer

```json
{
  "postType": "event",
  "eventFilters": {
    "venue": 42,
    "organizer": 15
  },
  "per_page": 50
}
```

#### Filter Venues by Location

```json
{
  "postType": "venue",
  "venueFilters": {
    "city": "San Francisco",
    "state": "CA"
  }
}
```

#### Filter Tickets by Event

```json
{
  "postType": "ticket",
  "ticketFilters": {
    "event": 123,
    "available": true,
    "type": "paid"
  }
}
```

### 3. tec-calendar-current-datetime

Get current date and time information for both local and WordPress server timezones. This tool is essential for creating events with proper relative dates.

#### Get Current DateTime

```json
{
  "tool": "tec-calendar-current-datetime"
}
```

**Response**:
```json
{
  "local": {
    "datetime": "2024-12-19 14:30:45",
    "timestamp": 1734620445,
    "timezone": "America/New_York",
    "timezone_offset": "-05:00",
    "date": "2024-12-19",
    "time": "14:30:45",
    "iso8601": "2024-12-19T19:30:45.000Z",
    "utc_datetime": "2024-12-19 19:30:45",
    "utc_offset_seconds": 18000
  },
  "server": {
    "datetime": "2024-12-19 19:30:45",
    "timestamp": 1734620445,
    "timezone": "UTC",
    "timezone_offset": "+00:00",
    "date": "2024-12-19",
    "time": "19:30:45",
    "iso8601": "2024-12-19T19:30:45.000Z",
    "utc_datetime": "2024-12-19 19:30:45",
    "utc_offset_seconds": 0
  },
  "usage_hints": {
    "date_format": "YYYY-MM-DD HH:MM:SS",
    "example_event_dates": {
      "today_3pm": "2024-12-19 15:00:00",
      "tomorrow_10am": "2024-12-20 10:00:00",
      "next_week": "2024-12-26"
    }
  }
}
```

### 4. tec-calendar-delete-entities

Delete posts either to trash (soft delete) or permanently.

#### Move to Trash (Default)

```json
{
  "postType": "event",
  "id": 123
}
```

#### Permanent Delete

```json
{
  "postType": "event",
  "id": 123,
  "force": true
}
```

## Common Patterns and Best Practices

### 1. Creating Events for Next Week

To create events for next week, calculate the dates properly:

```javascript
// Example: Create an event for next Monday at 3 PM
const nextMonday = new Date();
nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
nextMonday.setHours(15, 0, 0, 0);

const eventData = {
  "postType": "event",
  "data": {
    "title": "Weekly Team Meeting",
    "start_date": nextMonday.toISOString().slice(0, 19).replace('T', ' '),
    "end_date": new Date(nextMonday.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    "description": "Regular weekly team sync",
    "cost": "Free",
    "status": "publish"
  }
};
```

### 2. Finding Available Venues

First, list all venues, then reference them when creating events:

```json
// Step 1: Get all venues
{
  "postType": "venue",
  "filters": {
    "per_page": 100,
    "status": "publish"
  }
}

// Step 2: Use a venue ID from the results when creating an event
{
  "postType": "event",
  "data": {
    "title": "Concert",
    "venue": 42,
    // ... other fields
  }
}
```

### 3. Bulk Operations

To create multiple events, call the tool multiple times:

```json
// Event 1
{
  "postType": "event",
  "data": {
    "title": "Morning Yoga",
    "start_date": "2024-07-20 09:00:00",
    "end_date": "2024-07-20 10:00:00"
  }
}

// Event 2
{
  "postType": "event",
  "data": {
    "title": "Evening Meditation",
    "start_date": "2024-07-20 18:00:00",
    "end_date": "2024-07-20 19:00:00"
  }
}
```

## Field Reference

### Common Filter Fields
These filters are available for all post types at the top level:
- `page` - Page number for pagination
- `per_page` - Number of items per page
- `order` - Sort order ("asc" or "desc")
- `orderby` - Field to order by
- `status` - Post status (e.g., "publish", "draft")
- `include` - Array of IDs to include
- `exclude` - Array of IDs to exclude
- `query` - Search query string

### Post-Type Specific Filters

#### eventFilters (for events only)
- `start_date` - Filter by start date (YYYY-MM-DD)
- `end_date` - Filter by end date (YYYY-MM-DD)
- `venue` - Filter by venue ID
- `organizer` - Filter by organizer ID
- `featured` - Filter featured events (boolean)
- `categories` - Filter by category IDs
- `tags` - Filter by tag IDs

#### venueFilters (for venues only)
- `city` - Filter by city
- `state` - Filter by state/province
- `country` - Filter by country
- `zip` - Filter by postal code
- `geo_lat` - Filter by latitude (with geo_lng)
- `geo_lng` - Filter by longitude (with geo_lat)
- `radius` - Filter by radius in km (with geo_lat/geo_lng)

#### organizerFilters (for organizers only)
- `email` - Filter by email
- `website` - Filter by website
- `phone` - Filter by phone

#### ticketFilters (for tickets only)
- `event` - Filter by event ID
- `provider` - Filter by provider (RSVP, Ticket Commerce, WooCommerce)
- `type` - Filter by ticket type ("rsvp" or "paid")
- `available` - Filter by availability (boolean)
- `min_price` - Filter by minimum price
- `max_price` - Filter by maximum price

### Event Fields
- `title` (required) - Event name
- `start_date` (required) - Format: "YYYY-MM-DD HH:MM:SS"
- `end_date` (required) - Format: "YYYY-MM-DD HH:MM:SS"
- `description` - Event description
- `venue` - Venue ID (number)
- `organizer` - Organizer ID (number)
- `all_day` - Boolean for all-day events
- `url` - Event website
- `cost` - Event cost (e.g., "Free", "$25", "€19.99", "$10-$50")
- `cost_details` - Additional cost information
- `status` - "publish", "draft", "pending", etc.

### Venue Fields
- `venue` (required) - Venue name
- `address` - Street address
- `city` - City name
- `state` - State/Province
- `country` - Country name
- `zip` - Postal code
- `phone` - Contact phone
- `website` - Venue website
- `status` - Publication status

### Organizer Fields
- `organizer` (required) - Organizer name
- `phone` - Contact phone
- `website` - Organizer website
- `email` - Contact email
- `status` - Publication status

### Ticket Fields
- `title` (required) - Ticket type name
- `event_id` or `event` (required) - ID of the associated event
- `price` - Ticket price (number or string)
- `stock` - Total number of tickets available
- `manage_stock` - Enable inventory tracking (boolean)
- `capacity` - Maximum capacity for this ticket type
- `start_date` - When ticket sales start (soft requirement, defaults to 1 week before event) - Controls ticket visibility
- `end_date` - When ticket sales end (soft requirement, defaults to event start date) - Controls ticket availability
- `sale_price` - Discounted price (number or string)
- `sale_price_start_date` - When sale price starts
- `sale_price_end_date` - When sale price ends
- `show_description` - Display description on frontend (boolean)
- `sku` - Stock keeping unit for inventory tracking
- `description` - Ticket description
- `provider` - Ticketing provider (defaults to "Tickets Commerce")
- `status` - Publication status

## Error Handling

Common errors and solutions:

1. **Missing Required Fields**
   - Ensure all required fields are provided
   - Check field names match exactly (case-sensitive)

2. **Invalid Date Format**
   - Use "YYYY-MM-DD HH:MM:SS" format
   - Ensure valid date values

3. **Invalid Post Type**
   - Only use: "event", "venue", "organizer", "ticket"

4. **Referenced ID Not Found**
   - When setting venue or organizer, ensure the ID exists
   - Use tec-calendar-read-entities to find valid IDs first

## Tips for AI Assistants

1. **Always verify post types exist** before referencing them in events
2. **Use consistent date formats** - The Events Calendar expects specific formats
3. **Check results** after operations to confirm success
4. **Handle pagination** when listing many items
5. **Use filters effectively** to find specific posts
6. **Remember status values** - "publish" makes posts public, "draft" keeps them private

## Complete Workflow Example

Here's a complete example of creating an event with a new venue:

```json
// 1. First, get the current date/time for proper scheduling
{
  "tool": "tec-calendar-current-datetime"
}
// Returns current date/time info for calculating event dates

// 2. Create the venue
{
  "postType": "venue",
  "data": {
    "venue": "City Convention Center",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "country": "United States",
    "status": "publish"
  }
}
// Returns: { "id": 150, ... }

// 3. Then create the event using the venue ID
{
  "postType": "event",
  "data": {
    "title": "Tech Conference 2024",
    "start_date": "2024-08-15 09:00:00",
    "end_date": "2024-08-15 17:00:00",
    "description": "Annual technology conference",
    "venue": 150,
    "status": "publish"
  }
}
// Returns: { "id": 325, ... }

// 4. Verify the event was created
{
  "postType": "event",
  "id": 325
}
```

## Nested Creation (New Feature)

You can now create venues and organizers directly when creating an event, without needing separate API calls:

### Creating Event with New Venue and Organizers

```json
{
  "postType": "event",
  "data": {
    "title": "Developer Summit 2024",
    "start_date": "2024-09-10 09:00:00",
    "end_date": "2024-09-10 18:00:00",
    "description": "Annual developer conference",
    "venue": {
      "venue": "Tech Hub Center",
      "address": "456 Innovation Blvd",
      "city": "Seattle",
      "state": "WA",
      "country": "United States",
      "zip": "98101",
      "phone": "(206) 555-0123",
      "website": "https://techhub.center",
      "status": "publish"
    },
    "organizers": [
      {
        "organizer": "DevCon Organization",
        "email": "info@devcon.org",
        "phone": "(206) 555-0456",
        "website": "https://devcon.org",
        "status": "publish"
      },
      {
        "organizer": "Tech Community Seattle",
        "email": "hello@techseattle.com",
        "status": "publish"
      }
    ],
    "cost": "$199",
    "status": "publish"
  }
}
```

### Mixing IDs and New Data

You can also mix existing IDs with new data to create:

```json
{
  "postType": "event",
  "data": {
    "title": "Workshop Series",
    "start_date": "2024-10-01 14:00:00",
    "end_date": "2024-10-01 17:00:00",
    "venue": 42,  // Use existing venue ID
    "organizers": [
      15,  // Use existing organizer ID
      {
        "organizer": "New Workshop Leader",
        "email": "workshops@example.com",
        "status": "publish"
      }
    ],
    "status": "publish"
  }
}
```

This guide should help you use The Events Calendar MCP tools effectively. Remember to check the responses for any errors and adjust your requests accordingly.
