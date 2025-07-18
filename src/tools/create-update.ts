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
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (venue, address, city, country), Organizer (organizer), Ticket (name, price)'),
});

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
    
    // Get the appropriate schema for the post type
    const dataSchema = getSchemaForPostType(postType as PostType);
    
    // Validate the data against the schema
    const validatedData = dataSchema.parse(data);

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
 * Tool definition for create/update
 */
export const createUpdateTool = {
  name: 'calendar_create_update',
  description: `Create or update a calendar post (Event, Venue, Organizer, or Ticket).

For creating: provide postType and data.
For updating: provide postType, id, and data.

Date format for events: "YYYY-MM-DD HH:MM:SS" (e.g., "2024-12-25 15:00:00")

Example for creating an event:
{
  "postType": "event",
  "data": {
    "title": "My Event",
    "start_date": "2024-12-25 15:00:00",
    "end_date": "2024-12-25 17:00:00",
    "description": "Event description",
    "venue": 123
  }
}`,
  inputSchema: CreateUpdateSchema,
};