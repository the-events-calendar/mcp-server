import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for delete tool input
 */
export const DeleteSchema = z.object({
  postType: PostTypeSchema.describe('The type of post to delete (event, venue, organizer, or ticket)'),
  id: z.number().describe('Post ID to delete'),
  force: z.boolean().optional().default(false).describe('true for permanent delete, false for trash (default: false)'),
});

/**
 * Input shape for MCP SDK
 */
export const DeleteInputSchema = {
  postType: PostTypeSchema.describe('The type of post to delete (event, venue, organizer, or ticket)'),
  id: z.number().describe('Post ID to delete'),
  force: z.boolean().optional().default(false).describe('true for permanent delete, false for trash (default: false)'),
};

/**
 * Delete a post
 */
export async function deletePost(
  input: z.infer<typeof DeleteSchema>,
  apiClient: ApiClient
) {
  try {
    // Validate input
    const { postType, id, force } = DeleteSchema.parse(input);

    // Delete the post
    const result = await apiClient.deletePost(postType as PostType, id, force);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully ${force ? 'permanently deleted' : 'moved to trash'} ${postType} with ID: ${id}`,
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
 * JSON Schema for delete tool
 */
export const DeleteJsonSchema = {
  type: 'object' as const,
  properties: {
    postType: {
      type: 'string' as const,
      enum: ['event', 'venue', 'organizer', 'ticket'],
      description: 'The type of post to delete'
    },
    id: {
      type: 'number' as const,
      description: 'Post ID to delete'
    },
    force: {
      type: 'boolean' as const,
      description: 'true for permanent delete, false for trash (default: false)',
      default: false
    }
  },
  required: ['postType', 'id'] as const,
  additionalProperties: false
};

/**
 * Tool definition for delete
 */
export const deleteTool = {
  name: 'tec-calendar-delete-entities',
  description: `Delete a calendar post (Event, Venue, Organizer, or Ticket).

By default moves to trash. Set force=true for permanent deletion.

NOTE: When deleting time-sensitive content like events, consider using the tec-calendar-current-datetime tool to verify the current date/time context before deletion.

Example:
{"postType": "event", "id": 123, "force": false}`,
  inputSchema: DeleteInputSchema,
  jsonSchema: DeleteJsonSchema,
};