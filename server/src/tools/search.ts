import { z } from 'zod';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';

/**
 * Schema for search tool input
 * Initially only supports events, but structured to be extensible
 */
export const SearchSchema = z.object({
  postType: z.literal('event'), // Will be extended to other types later
  query: z.string().min(1),
  filters: z.object({
    page: z.number().optional(),
    per_page: z.number().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    orderby: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    venue: z.number().optional(),
    organizer: z.number().optional(),
  }).optional(),
});

/**
 * Search posts
 */
export async function searchPosts(
  input: z.infer<typeof SearchSchema>,
  apiClient: ApiClient
) {
  try {
    // Validate input
    const { postType, query, filters } = SearchSchema.parse(input);

    // Perform search
    const results = await apiClient.searchPosts(postType, query, filters || {});
    const count = results.length;

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${count} ${postType}${count !== 1 ? 's' : ''} matching "${query}"`,
        },
        {
          type: 'text' as const,
          text: JSON.stringify(results, null, 2),
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
 * Tool definition for search
 */
export const searchTool = {
  name: 'search_posts',
  description: 'Search for events by keyword (will be extended to other post types)',
  inputSchema: SearchSchema,
};