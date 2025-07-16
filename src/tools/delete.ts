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
  name: 'delete_post',
  description: 'Delete a post (move to trash or permanently delete)',
  inputSchema: DeleteSchema,
};