import { z } from 'zod';
import { PostTypeSchema, getSchemaForPostType } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';
import { getLogger } from '../utils/logger.js';
import { generateToolDescription } from '../utils/example-generator.js';

/**
 * Schema for create/update tool input
 */
export const CreateUpdateSchema = z.object({
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field.'),
});

/**
 * Input shape for MCP SDK
 */
export const CreateUpdateInputSchema = {
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field.'),
};

/**
 * Create or update a post
 */
export async function createUpdatePost(
  input: z.infer<typeof CreateUpdateSchema>,
  apiClient: ApiClient
) {
  const logger = getLogger();
  
  try {
    // Validate input
    const { postType, id, data } = CreateUpdateSchema.parse(input);
    logger.verbose(`${id ? 'Updating' : 'Creating'} ${postType}`, { id, dataKeys: Object.keys(data) });
    
    // Transform data for venue and organizer
    const transformedData = { ...data };
    if (postType === 'venue' || postType === 'organizer') {
      // If title is provided, also set it as venue/organizer field
      if (transformedData.title) {
        transformedData[postType] = transformedData.title;
        logger.debug(`Transformed title to ${postType} field:`, transformedData.title);
      }
      // If venue/organizer field is provided but not title, set title from it
      else if (transformedData[postType] && !transformedData.title) {
        transformedData.title = transformedData[postType];
        logger.debug(`Set title from ${postType} field:`, transformedData[postType]);
      }
      // If neither is provided, that's an error we'll catch in validation
    }
    
    // Validate required fields for creation
    if (!id) {
      // This is a creation operation
      if (!transformedData.title) {
        throw new Error(`Title is required when creating a new ${postType}`);
      }
      
      // Additional required fields validation for specific post types
      if (postType === 'event') {
        if (!transformedData.start_date || !transformedData.end_date) {
          throw new Error('Both start_date and end_date are required when creating an event');
        }
      }
    }
    
    // Get the appropriate schema for the post type
    const dataSchema = getSchemaForPostType(postType as PostType);
    logger.silly('Using schema for validation:', postType);
    
    // Validate the data against the schema
    const validatedData = dataSchema.parse(transformedData);
    logger.debug('Validated data:', validatedData);

    // Perform create or update
    logger.info(`${id ? 'Updating' : 'Creating'} ${postType}${id ? ` with ID ${id}` : ''}`);
    const result = id
      ? await apiClient.updatePost(postType as PostType, id, validatedData)
      : await apiClient.createPost(postType as PostType, validatedData);
    
    logger.info(`Successfully ${id ? 'updated' : 'created'} ${postType} with ID: ${result.id}`);

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
    logger.error(`Failed to ${input.id ? 'update' : 'create'} post:`, error);
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
      description: 'The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. ⚠️ ALWAYS call tec-calendar-current-datetime tool FIRST before setting any date/time fields to ensure correct relative dates.',
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
  name: 'tec-calendar-create-update-entities',
  description: generateToolDescription(
    'tec-calendar-create-update-entities',
    `Create or update a calendar post (Event, Venue, Organizer, or Ticket).

For creating: provide postType and data.
For updating: provide postType, id, and data.`,
    ['event', 'venue', 'organizer', 'ticket'] as PostType[]
  ),
  inputSchema: CreateUpdateInputSchema,
  jsonSchema: CreateUpdateJsonSchema,
};