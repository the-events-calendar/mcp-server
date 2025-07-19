# MCP Calendar Tools Guide

This guide provides comprehensive examples and best practices for using The Events Calendar MCP tools. These tools allow you to create, read, update, delete, and search calendar posts in WordPress.

## Overview

The MCP server provides three main tools:
- `calendar_create_update_entity` - Create new posts or update existing ones
- `calendar_read_entity` - Read, list, or search posts
- `calendar_delete_entity` - Delete posts (trash or permanent)

All tools support four post types:
- `event` - Calendar events
- `venue` - Event locations
- `organizer` - Event organizers  
- `ticket` - Event tickets

## Tool Usage Examples

### 1. calendar_create_update_entity

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

```json
{
  "postType": "ticket",
  "data": {
    "name": "General Admission",
    "price": "49.99",
    "description": "Standard entry ticket",
    "capacity": 500,
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

### 2. calendar_read_entity

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
  "filters": {
    "per_page": 20,
    "page": 1,
    "status": "publish",
    "order": "desc",
    "orderby": "date"
  }
}
```

#### Search Posts by Query

```json
{
  "postType": "event",
  "query": "music festival",
  "filters": {
    "per_page": 10,
    "status": "publish"
  }
}
```

#### Filter Events by Date Range

```json
{
  "postType": "event",
  "filters": {
    "start_date": "2024-07-01",
    "end_date": "2024-07-31",
    "status": "publish"
  }
}
```

#### Filter Events by Venue or Organizer

```json
{
  "postType": "event",
  "filters": {
    "venue": 42,
    "organizer": 15,
    "per_page": 50
  }
}
```

### 3. calendar_delete_entity

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
- `name` (required) - Ticket type name
- `price` (required) - Ticket price (number or string)
- `description` - Ticket description
- `capacity` - Available tickets
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
   - Use calendar_read_entity to find valid IDs first

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
// 1. First, create the venue
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

// 2. Then create the event using the venue ID
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

// 3. Verify the event was created
{
  "postType": "event",
  "id": 325
}
```

This guide should help you use The Events Calendar MCP tools effectively. Remember to check the responses for any errors and adjust your requests accordingly.