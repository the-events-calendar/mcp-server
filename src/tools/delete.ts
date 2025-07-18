import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for delete tool input
 */
export const DeleteSchema = z.object({
  postType: PostTypeSchema,
  id: z.number(),
  force: z.boolean().optional().default(false),
});

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
 * Tool definition for delete
 */
export const deleteTool = {
  name: 'calendar_delete',
  description: `Delete a calendar post (Event, Venue, Organizer, or Ticket).

By default moves to trash. Set force=true for permanent deletion.

Example:
{"postType": "event", "id": 123, "force": false}`,
  inputSchema: {
    type: 'object',
    properties: {
      postType: {
        type: 'string',
        enum: ['event', 'venue', 'organizer', 'ticket'],
        description: 'The type of post to delete'
      },
      id: {
        type: 'number',
        description: 'Post ID to delete'
      },
      force: {
        type: 'boolean',
        description: 'true for permanent delete, false for trash (default: false)',
        default: false
      }
    },
    required: ['postType', 'id']
  },
};