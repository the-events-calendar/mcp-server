import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for read tool input
 * Supports both reading by ID and searching by query
 */
export const ReadSchema = z.object({
  postType: PostTypeSchema,
  id: z.number().optional(),
  query: z.string().optional(), // Search query - when provided, performs search
  filters: z.object({
    page: z.number().optional(),
    per_page: z.number().optional(),
    search: z.string().optional(), // Deprecated - use top-level query instead
    order: z.enum(['asc', 'desc']).optional(),
    orderby: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    include: z.array(z.number()).optional(),
    exclude: z.array(z.number()).optional(),
    // Event-specific filters
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    venue: z.number().optional(),
    organizer: z.number().optional(),
  }).optional(),
});

/**
 * Read posts - supports reading by ID, listing, and searching
 */
export async function readPost(
  input: z.infer<typeof ReadSchema>,
  apiClient: ApiClient
) {
  try {
    // Validate input
    const { postType, id, query, filters } = ReadSchema.parse(input);

    let result;
    let resultDescription: string;

    if (id) {
      // Get single post by ID
      result = await apiClient.getPost(postType as PostType, id);
      resultDescription = `Retrieved ${postType} with ID ${id}`;
    } else {
      // Prepare filters with search query if provided
      const searchFilters = {
        ...filters,
        // Use top-level query if provided, otherwise fall back to filters.search
        search: query || filters?.search,
      };

      // List or search posts
      result = await apiClient.listPosts(postType as PostType, searchFilters || {});
      
      const posts = Array.isArray(result) ? result : [result];
      const count = posts.length;
      
      if (query || filters?.search) {
        const searchTerm = query || filters?.search;
        resultDescription = `Found ${count} ${postType}${count !== 1 ? 's' : ''} matching "${searchTerm}"`;
      } else {
        resultDescription = `Found ${count} ${postType}${count !== 1 ? 's' : ''}`;
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: resultDescription,
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
  name: 'calendar_read',
  description: 'Read a single post by ID, list posts, or search posts by query. Supports all post types (event, venue, organizer, ticket)',
  inputSchema: ReadSchema,
};