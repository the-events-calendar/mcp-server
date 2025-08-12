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
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, sales dates default to 1 week before event (start) and event start date (end) if not specified.'),
});

/**
 * Input shape for MCP SDK
 */
export const CreateUpdateInputSchema = {
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, sales dates default to 1 week before event (start) and event start date (end) if not specified.'),
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

      // Ticket-specific validation and defaults
      if (postType === 'ticket') {
        // Normalize event_id to event field
        if (transformedData.event_id && !transformedData.event) {
          transformedData.event = transformedData.event_id;
        }

        // Require event association
        if (!transformedData.event && !transformedData.event_id) {
          throw new Error('Tickets must be associated with an event. Please provide either "event" or "event_id" field with the event ID.');
        }

        // If no sale dates provided, we need to fetch the event to set defaults
        // Note: These are soft requirements - tickets won't display/be available outside these dates
        if (!transformedData.start_date || !transformedData.end_date) {
          const eventId = transformedData.event || transformedData.event_id;
          logger.debug(`Fetching event ${eventId} to calculate ticket sale dates`);

          try {
            // Fetch the event to get its dates
            const event = await apiClient.getPost('event', eventId);

            if (!event || !event.start_date) {
              throw new Error(`Could not fetch event ${eventId} or event has no start date`);
            }

            // Parse event start date
            const eventStartDate = new Date(event.start_date);

            // Default ticket sale end date to event start date
            // IMPORTANT: Tickets won't be available for purchase after this date
            if (!transformedData.end_date) {
              transformedData.end_date = event.start_date;
              logger.info(`Set ticket sale end date to event start: ${transformedData.end_date} (tickets unavailable after this)`);
            }

            // Default ticket sale start date to 1 week before event
            // IMPORTANT: Tickets won't be visible/available before this date
            if (!transformedData.start_date) {
              const saleStartDate = new Date(eventStartDate);
              saleStartDate.setDate(saleStartDate.getDate() - 7);

              // Format as Y-m-d H:i:s
              const year = saleStartDate.getFullYear();
              const month = String(saleStartDate.getMonth() + 1).padStart(2, '0');
              const day = String(saleStartDate.getDate()).padStart(2, '0');
              const hours = String(saleStartDate.getHours()).padStart(2, '0');
              const minutes = String(saleStartDate.getMinutes()).padStart(2, '0');
              const seconds = String(saleStartDate.getSeconds()).padStart(2, '0');

              transformedData.start_date = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
              logger.info(`Set ticket sale start date to 1 week before event: ${transformedData.start_date} (tickets not visible before this)`);
            }
          } catch (error) {
            logger.error(`Failed to fetch event for ticket date calculation:`, error);
            throw new Error(`Failed to fetch event ${eventId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Ensure event_id field is set (the API expects this field name)
        transformedData.event_id = transformedData.event || transformedData.event_id;

        // Set default provider to "Tickets Commerce" unless specifically provided
        if (!transformedData.provider) {
          transformedData.provider = 'Tickets Commerce';
          logger.info('Set default ticket provider to "Tickets Commerce"');
        }
      }
    }

    // Remove price fields set to 0 for ticket creation (prevents validation errors)
    if (postType === 'ticket') {
      if (transformedData.price === 0) {
        delete transformedData.price;
        logger.info('Removed price field set to 0 - WordPress will default to free ticket');
      }
      if (transformedData.sale_price === 0) {
        delete transformedData.sale_price;
        logger.info('Removed sale_price field set to 0 - WordPress will default to null');
      }
    }

    // Get the appropriate schema for the post type
    const dataSchema = getSchemaForPostType(postType as PostType);
    logger.silly('Using schema for validation:', postType);

    // Validate the data against the schema
    logger.debug('About to validate data:', transformedData);
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
      description: 'The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event_id or event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, sales dates default to 1 week before event (start) and event start date (end) if not specified. ⚠️ ALWAYS call tec-calendar-current-datetime tool FIRST before setting any date/time fields to ensure correct relative dates.',
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
For updating: provide postType, id, and data.

**FREE TICKETS**: To create free tickets, omit the price field entirely. WordPress will automatically default to price 0. Do NOT set price to 0 explicitly as this triggers validation errors. Both Tickets Commerce and RSVP providers support free tickets when the price field is omitted.

**UNLIMITED TICKETS**: To create unlimited tickets, set manage_stock to false. When manage_stock is false, the stock field will automatically be set to -1 for unlimited availability.`,
    ['event', 'venue', 'organizer', 'ticket'] as PostType[]
  ),
  inputSchema: CreateUpdateInputSchema,
  jsonSchema: CreateUpdateJsonSchema,
};
