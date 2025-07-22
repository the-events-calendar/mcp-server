import { z } from 'zod';
import { PostTypeSchema, getSchemaForPostType } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for create/update tool input
 */
export const CreateUpdateSchema = z.object({
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (name, price). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field.'),
});

/**
 * Input shape for MCP SDK
 */
export const CreateUpdateInputSchema = {
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (name, price). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field.'),
};

/**
 * Create or update a post
 */
export async function createUpdatePost(
  input: z.infer<typeof CreateUpdateSchema>,
  apiClient: ApiClient
) {
  try {
    // Validate input
    const { postType, id, data } = CreateUpdateSchema.parse(input);
    
    console.error('[DEBUG] Original data:', JSON.stringify(data, null, 2));
    
    // Transform data for venue and organizer
    const transformedData = { ...data };
    if (postType === 'venue' || postType === 'organizer') {
      // If title is provided, also set it as venue/organizer field
      if (transformedData.title) {
        transformedData[postType] = transformedData.title;
      }
      // If venue/organizer field is provided but not title, set title from it
      else if (transformedData[postType] && !transformedData.title) {
        transformedData.title = transformedData[postType];
      }
      // If neither is provided, that's an error we'll catch in validation
    }
    
    console.error('[DEBUG] Transformed data:', JSON.stringify(transformedData, null, 2));
    
    // Get the appropriate schema for the post type
    const dataSchema = getSchemaForPostType(postType as PostType);
    
    // Validate the data against the schema
    const validatedData = dataSchema.parse(transformedData);
    
    console.error('[DEBUG] Validated data:', JSON.stringify(validatedData, null, 2));

    // Perform create or update
    const result = id
      ? await apiClient.updatePost(postType as PostType, id, validatedData)
      : await apiClient.createPost(postType as PostType, validatedData);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully ${id ? 'updated' : 'created'} ${postType} with ID: ${result.id}`,
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [formatError(error)],
      isError: true,
    };
  }
}

/**
 * JSON Schema for create/update tool
 */
export const CreateUpdateJsonSchema = {
  type: 'object' as const,
  properties: {
    postType: {
      type: 'string' as const,
      enum: ['event', 'venue', 'organizer', 'ticket'],
      description: 'The type of post to create or update'
    },
    id: {
      type: 'number' as const,
      description: 'Post ID (required for updates, omit for creation)'
    },
    data: {
      type: 'object' as const,
      description: 'The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (name, price). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. ⚠️ ALWAYS call current_datetime tool FIRST before setting any date/time fields to ensure correct relative dates.',
      additionalProperties: true
    }
  },
  required: ['postType', 'data'] as const,
  additionalProperties: false
};

/**
 * Tool definition for create/update
 */
export const createUpdateTool = {
  name: 'calendar_create_update_entity',
  description: `Create or update a calendar post (Event, Venue, Organizer, or Ticket).

For creating: provide postType and data.
For updating: provide postType, id, and data.

⚠️ IMPORTANT: Before creating events with dates/times, ALWAYS call the current_datetime tool first to get the current date, time, and timezone context. This ensures you create events with accurate dates relative to "today" or "tomorrow".

Date format for events: "YYYY-MM-DD HH:MM:SS" (e.g., "2024-12-25 15:00:00")

Workflow example:
1. First: Call current_datetime tool to get current date/time
2. Then: Create event with calculated dates based on the response

Examples:

// Creating an event
{
  "postType": "event",
  "data": {
    "title": "My Event",
    "start_date": "2024-12-25 15:00:00",
    "end_date": "2024-12-25 17:00:00",
    "description": "Event description",
    "venue": 123
  }
}

// Creating a venue (using title)
{
  "postType": "venue",
  "data": {
    "title": "Conference Center",
    "address": "123 Main St",
    "city": "San Francisco",
    "country": "United States"
  }
}

// Creating an organizer (using title)
{
  "postType": "organizer",
  "data": {
    "title": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234"
  }
}`,
  inputSchema: CreateUpdateInputSchema,
  jsonSchema: CreateUpdateJsonSchema,
};