import { z } from 'zod';
import { PostTypeSchema, getSchemaForPostType } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';

/**
 * Schema for create/update tool input
 */
export const CreateUpdateSchema = z.object({
  postType: PostTypeSchema,
  id: z.number().optional(),
  data: z.record(z.string(), z.any()),
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
  description: 'Create or update a post (Event, Venue, Organizer, or Ticket)',
  inputSchema: CreateUpdateSchema,
};