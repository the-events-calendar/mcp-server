import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { getRequestSchemaForPostType } from '../types/schemas/index.js';
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
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, all date fields must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00"). Sales dates default to 1 week before event (start) and event start date (end) if not specified. User-specified ticket end_date will always override the default capping to the event start date.'),
});

/**
 * Input shape for MCP SDK
 */
export const CreateUpdateInputSchema = {
  postType: PostTypeSchema.describe('The type of post to create or update (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID (required for updates, omit for creation)'),
  data: z.record(z.string(), z.any()).describe('The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, all date fields must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00"). Sales dates default to 1 week before event (start) and event start date (end) if not specified. User-specified ticket end_date will always override the default capping to the event start date.'),
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
        // Detect whether the user explicitly provided an end_date. If they did,
        // we will respect it and not apply automatic capping later.
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
        // The start_date and end_date fields control when tickets are available for purchase
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

        // We will enforce capping after ticket creation only when the end_date
        // was not provided by the user.
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

      // Normalize inventory: prioritize syncing stock/capacity first, then manage_stock
      const hasStockNumber = typeof transformedData.stock === 'number' && !Number.isNaN(transformedData.stock);
      const hasCapacityNumber = typeof transformedData.capacity === 'number' && !Number.isNaN(transformedData.capacity);

      // If capacity is missing but stock is provided, mirror stock into capacity
      if (!hasCapacityNumber && hasStockNumber) {
        transformedData.capacity = transformedData.stock;
        logger.info(`Capacity not provided; defaulting capacity to stock: ${transformedData.capacity}`);
      }

      // If stock is missing but capacity is provided, mirror capacity into stock
      if (!hasStockNumber && hasCapacityNumber) {
        transformedData.stock = transformedData.capacity;
        logger.info(`Stock not provided; defaulting stock to capacity: ${transformedData.stock}`);
      }

      // If manage_stock is explicitly set to false, set stock_mode to unlimited for unlimited tickets
      // This must be checked BEFORE the stock/capacity enforcement logic
      if (transformedData.manage_stock === false) {
        transformedData.stock_mode = 'unlimited';
        delete transformedData.manage_stock; // Remove manage_stock as it's not part of the API
        logger.info('manage_stock set to false; setting stock_mode to unlimited for unlimited tickets');
        logger.debug('After setting unlimited, transformedData:', transformedData);
        // Skip the rest of the stock/capacity logic for unlimited tickets
        // Set a flag to indicate this is an unlimited ticket
        transformedData._isUnlimited = true;
      }

      // Re-evaluate after normalization
      const normalizedHasStock = typeof transformedData.stock === 'number' && !Number.isNaN(transformedData.stock);
      const normalizedHasCapacity = typeof transformedData.capacity === 'number' && !Number.isNaN(transformedData.capacity);

      // Auto-expand capacity to be at least stock when both provided and stock is greater.
      if (normalizedHasStock && normalizedHasCapacity) {
        const stockNum = Number(transformedData.stock);
        const capacityNum = Number(transformedData.capacity);
        if (stockNum > capacityNum) {
          transformedData.capacity = stockNum;
          logger.info(`Stock (${stockNum}) greater than capacity (${capacityNum}); auto-expanding capacity to ${stockNum}`);
        }
      }

      // If manage_stock is explicitly set to false, set stock_mode to unlimited for unlimited tickets
      // This must be checked BEFORE the stock/capacity enforcement logic
      if (transformedData.manage_stock === false) {
        transformedData.stock_mode = 'unlimited';
        delete transformedData.manage_stock; // Remove manage_stock as it's not part of the API
        logger.info('manage_stock set to false; setting stock_mode to unlimited for unlimited tickets');
        logger.debug('After setting unlimited, transformedData:', transformedData);
      }
      // If either stock or capacity is set, enforce manage_stock = true (but only if not already set to unlimited)
      else if (!transformedData._isUnlimited && (normalizedHasStock || normalizedHasCapacity)) {
        if (transformedData.manage_stock !== true) {
          transformedData.manage_stock = true;
          logger.info('Stock or capacity provided; setting manage_stock to true');
        }
      }

      // Clean up the temporary flag
      if (transformedData._isUnlimited) {
        delete transformedData._isUnlimited;
      }
    }

    // Get the appropriate request schema for the post type (for create/update operations)
    const dataSchema = getRequestSchemaForPostType(postType as PostType);
    logger.silly('Using request schema for validation:', postType);

    // Normalize any flexible date formats into the API-preferred format.
    // We accept flexible inputs (e.g., "next monday", "+2 days", ISO with T, etc.)
    // but transform them into `YYYY-MM-DD HH:MM:SS` before validation/send.
    const { formatDateTime, parseFlexibleDate } = await import('../utils/time.js');

    function normalizeField(fieldName: string) {
      if (!transformedData[fieldName] || typeof transformedData[fieldName] !== 'string') return;
      const raw = String(transformedData[fieldName]).trim();
      // Try to parse flexible date.
      const parsed = parseFlexibleDate(raw);
      if (parsed) {
        transformedData[fieldName] = formatDateTime(parsed);
        return;
      }
      // If parsing failed but the string already matches the preferred pattern,
      // leave it as-is. Otherwise, we'll allow validation to fail and return
      // a descriptive error to the client.
      const prefRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/;
      if (prefRegex.test(raw)) {
        transformedData[fieldName] = raw;
        return;
      }
      // Attempt ISO parse (with T) as a last resort.
      const isoAttempt = new Date(raw.replace(' ', 'T'));
      if (Number.isFinite(isoAttempt.getTime())) {
        transformedData[fieldName] = formatDateTime(isoAttempt);
        return;
      }
      // Mark invalid format for clearer error handling later.
      transformedData[`_invalid_${fieldName}`] = raw;
    }

    ['start_date', 'end_date', 'start_date_utc', 'end_date_utc', 'sale_price_start_date', 'sale_price_end_date', 'start_date', 'end_date'].forEach(normalizeField);

    // If any invalid date markers exist, return a clean error to the client.
    const invalidDateFields = Object.keys(transformedData)
      .filter(k => k.startsWith('_invalid_'))
      .map(k => ({ field: k.replace('_invalid_', ''), value: transformedData[k] }));
    if (invalidDateFields.length > 0) {
      const message = `One or more date fields are invalid. Please use a valid date or the preferred format YYYY-MM-DD HH:MM:SS.`;
      throw new (await import('../utils/error-handling.js')).ApiError(message, 400, 'invalid_date_format', { invalid_fields: invalidDateFields });
    }

    // Validate the data against the schema
    logger.debug('About to validate data:', transformedData);
    const validatedData = dataSchema.parse(transformedData);
    logger.debug('Validated data:', validatedData);

    // Perform create or update
    logger.info(`${id ? 'Updating' : 'Creating'} ${postType}${id ? ` with ID ${id}` : ''}`);
    // Default publish status unless provided
    if (validatedData && typeof validatedData === 'object' && (validatedData as any).status === undefined) {
      (validatedData as any).status = 'publish';
    }
    let result = id
      ? await apiClient.updatePost(postType as PostType, id, validatedData)
      : await apiClient.createPost(postType as PostType, validatedData);

    // For newly created tickets, cap end_date to event start by default unless the
    // user explicitly provided an end_date in the input.
    if (!id && postType === 'ticket') {
      try {
        const userProvidedEndDate = Object.prototype.hasOwnProperty.call(data, 'end_date');

        if (!userProvidedEndDate && result && result.id && (result as any).event_id) {
          const eventIdForCap = (result as any).event_id as number;
          const event = await apiClient.getPost('event', eventIdForCap);
          if (event && event.start_date && (result as any).end_date) {
            const toDate = (s: string) => new Date(String(s).replace(' ', 'T'));
            const eventStart = toDate(event.start_date);
            const ticketEnd = toDate((result as any).end_date);

            if (Number.isFinite(eventStart.getTime()) && Number.isFinite(ticketEnd.getTime())) {
              if (ticketEnd.getTime() > eventStart.getTime()) {
                logger.info(`Capping ticket end_date (${(result as any).end_date}) to event start (${event.start_date}) by default`);
                const updated = await apiClient.updatePost('ticket' as PostType, result.id, { end_date: event.start_date });
                result = updated;
              }
            } else {
              logger.warn('Unable to parse dates for capping comparison; skipping cap.');
            }
          }
        }
      } catch (capError) {
        logger.warn('Failed to apply end_date capping logic after ticket creation:', capError);
      }
    }

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
      description: 'The post data. Required fields depend on postType: Event (title, start_date, end_date), Venue (title or venue, address, city, country), Organizer (title or organizer), Ticket (title, event_id or event). Note: For Venue and Organizer, you can use "title" which will be converted to the appropriate field. For Tickets, all date fields must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00"). Sales dates default to 1 week before event (start) and event start date (end) if not specified. By default, ticket end_date will be capped to the event start date unless allow_end_after_event: true is provided.',
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

**TICKET AVAILABILITY DATES**: Use start_date and end_date fields to control when tickets are available for purchase. start_date is when tickets become available, end_date is when sales stop (typically the event start time). All ticket date fields must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00"). If not provided, defaults to 1 week before event (start) and event start time (end). By default, end_date will be capped to the event start unless you pass allow_end_after_event: true.

**SALE PRICING**: To offer tickets at a reduced price during specific periods:
- price: Regular ticket price
- sale_price: Discounted price (must be less than regular price)
- sale_price_start_date: When the sale price becomes active
- sale_price_end_date: When the sale price expires (reverts to regular price)

Example: Regular $50 ticket on sale for $35 from Dec 1-15:
\`\`\`json
{
  "price": 50,
  "sale_price": 35,
  "sale_price_start_date": "2024-12-01",
  "sale_price_end_date": "2024-12-15"
}
\`\`\`

**NOTE**: Ticket availability dates (start_date, end_date) must be provided in Y-m-d H:i:s format. Sale price dates (sale_price_start_date, sale_price_end_date) must be provided in YYYY-MM-DD format. Natural language dates like "now", "tomorrow", "+1 day" are NOT supported for tickets.

**UNLIMITED TICKETS**: To create unlimited tickets, set manage_stock to false. When manage_stock is false, stock_mode will automatically be set to "unlimited" for unlimited availability.`,
    ['event', 'venue', 'organizer', 'ticket'] as PostType[]
  ),
  inputSchema: CreateUpdateInputSchema,
  jsonSchema: CreateUpdateJsonSchema,
};
