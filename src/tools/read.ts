import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for read tool input
 */
export const ReadSchema = z.object({
  postType: PostTypeSchema,
  id: z.number().optional(),
  filters: z.object({
    page: z.number().optional(),
    per_page: z.number().optional(),
    search: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    orderby: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    include: z.array(z.number()).optional(),
    exclude: z.array(z.number()).optional(),
  }).optional(),
});

/**
 * Read posts
 */
export async function readPost(
  input: z.infer<typeof ReadSchema>,
  apiClient: ApiClient
) {
  try {
    // Validate input
    const { postType, id, filters } = ReadSchema.parse(input);

    // Get single post or list
    const result = id
      ? await apiClient.getPost(postType as PostType, id)
      : await apiClient.listPosts(postType as PostType, filters || {});

    const posts = Array.isArray(result) ? result : [result];
    const count = posts.length;

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${count} ${postType}${count !== 1 ? 's' : ''}`,
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
 * Tool definition for read
 */
export const readTool = {
  name: 'read_post',
  description: 'Read a single post by ID or list posts with optional filters',
  inputSchema: ReadSchema,
};