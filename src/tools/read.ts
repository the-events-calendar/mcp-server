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
  postType: PostTypeSchema.describe('The type of post to read (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID for single post retrieval'),
  query: z.string().optional().describe('Search query string'),
  filters: z.object({
    page: z.number().optional().describe('Page number'),
    per_page: z.number().optional().describe('Items per page'),
    search: z.string().optional().describe('Search term (deprecated - use top-level query instead)'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    orderby: z.string().optional().describe('Field to order by'),
    status: z.union([z.string(), z.array(z.string())]).optional().describe('Post status filter'),
    include: z.array(z.number()).optional().describe('Include specific IDs'),
    exclude: z.array(z.number()).optional().describe('Exclude specific IDs'),
    // Event-specific filters
    start_date: z.string().optional().describe('Event start date filter (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('Event end date filter (YYYY-MM-DD)'),
    venue: z.number().optional().describe('Filter by venue ID'),
    organizer: z.number().optional().describe('Filter by organizer ID'),
  }).optional().describe('Optional filters for listing and searching'),
});

/**
 * Input shape for MCP SDK
 */
export const ReadInputSchema = {
  postType: PostTypeSchema.describe('The type of post to read (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID for single post retrieval'),
  query: z.string().optional().describe('Search query string'),
  filters: z.object({
    page: z.number().optional().describe('Page number'),
    per_page: z.number().optional().describe('Items per page'),
    search: z.string().optional().describe('Search term (deprecated - use top-level query instead)'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    orderby: z.string().optional().describe('Field to order by'),
    status: z.union([z.string(), z.array(z.string())]).optional().describe('Post status filter'),
    include: z.array(z.number()).optional().describe('Include specific IDs'),
    exclude: z.array(z.number()).optional().describe('Exclude specific IDs'),
    // Event-specific filters
    start_date: z.string().optional().describe('Event start date filter (YYYY-MM-DD)'),
    end_date: z.string().optional().describe('Event end date filter (YYYY-MM-DD)'),
    venue: z.number().optional().describe('Filter by venue ID'),
    organizer: z.number().optional().describe('Filter by organizer ID'),
  }).optional().describe('Optional filters for listing and searching'),
};

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
 * JSON Schema for read tool
 */
export const ReadJsonSchema = {
  type: 'object' as const,
  properties: {
    postType: {
      type: 'string' as const,
      enum: ['event', 'venue', 'organizer', 'ticket'],
      description: 'The type of post to read'
    },
    id: {
      type: 'number' as const,
      description: 'Post ID for single post retrieval'
    },
    query: {
      type: 'string' as const,
      description: 'Search query string'
    },
    filters: {
      type: 'object' as const,
      description: 'Optional filters for listing and searching',
      properties: {
        page: { type: 'number' as const, description: 'Page number' },
        per_page: { type: 'number' as const, description: 'Items per page' },
        search: { type: 'string' as const, description: 'Search term (deprecated - use top-level query instead)' },
        order: { type: 'string' as const, enum: ['asc', 'desc'], description: 'Sort order' },
        orderby: { type: 'string' as const, description: 'Field to order by' },
        status: {
          oneOf: [
            { type: 'string' as const },
            { type: 'array' as const, items: { type: 'string' as const } }
          ],
          description: 'Post status filter'
        },
        include: { type: 'array' as const, items: { type: 'number' as const }, description: 'Include specific IDs' },
        exclude: { type: 'array' as const, items: { type: 'number' as const }, description: 'Exclude specific IDs' },
        start_date: { type: 'string' as const, description: 'Event start date filter (YYYY-MM-DD)' },
        end_date: { type: 'string' as const, description: 'Event end date filter (YYYY-MM-DD)' },
        venue: { type: 'number' as const, description: 'Filter by venue ID' },
        organizer: { type: 'number' as const, description: 'Filter by organizer ID' }
      },
      additionalProperties: false
    }
  },
  required: ['postType'] as const,
  additionalProperties: false
};

/**
 * Tool definition for read
 */
export const readTool = {
  name: 'calendar_read_entity',
  description: `Read, list, or search calendar posts.

Use cases:
1. Get single post: provide postType and id
2. List all posts: provide postType only
3. Search posts: provide postType and query

Examples:

// Get single event
{"postType": "event", "id": 123}

// List all venues
{"postType": "venue", "filters": {"per_page": 10}}

// Search events
{"postType": "event", "query": "conference", "filters": {"start_date": "2024-12-01"}}`,
  inputSchema: ReadInputSchema,
  jsonSchema: ReadJsonSchema,
};