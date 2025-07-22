import { z } from 'zod';
import { PostTypeSchema } from '../utils/validation.js';
import { formatError } from '../utils/error-handling.js';
import { ApiClient } from '../api/client.js';
import { PostType } from '../types/index.js';


/**
 * Event-specific filters
 */
const EventFiltersSchema = z.object({
  start_date: z.string().optional().describe('Event start date filter (YYYY-MM-DD). ⚠️ Call current_datetime tool FIRST to get current date.'),
  end_date: z.string().optional().describe('Event end date filter (YYYY-MM-DD). ⚠️ Call current_datetime tool FIRST to get current date.'),
  venue: z.number().optional().describe('Filter by venue ID'),
  organizer: z.number().optional().describe('Filter by organizer ID'),
  featured: z.boolean().optional().describe('Filter featured events'),
  categories: z.array(z.number()).optional().describe('Filter by category IDs'),
  tags: z.array(z.number()).optional().describe('Filter by tag IDs'),
});

/**
 * Venue-specific filters
 */
const VenueFiltersSchema = z.object({
  city: z.string().optional().describe('Filter by city'),
  state: z.string().optional().describe('Filter by state/province'),
  country: z.string().optional().describe('Filter by country'),
  zip: z.string().optional().describe('Filter by postal code'),
  geo_lat: z.number().optional().describe('Filter by latitude (requires geo_lng)'),
  geo_lng: z.number().optional().describe('Filter by longitude (requires geo_lat)'),
  radius: z.number().optional().describe('Filter by radius in km (requires geo_lat/geo_lng)'),
});

/**
 * Organizer-specific filters
 */
const OrganizerFiltersSchema = z.object({
  email: z.string().optional().describe('Filter by email'),
  website: z.string().optional().describe('Filter by website'),
  phone: z.string().optional().describe('Filter by phone'),
});

/**
 * Ticket-specific filters
 */
const TicketFiltersSchema = z.object({
  event: z.number().optional().describe('Filter by event ID'),
  provider: z.string().optional().describe('Filter by provider (RSVP, Ticket Commerce, WooCommerce)'),
  type: z.enum(['rsvp', 'paid']).optional().describe('Filter by ticket type'),
  available: z.boolean().optional().describe('Filter by availability'),
  min_price: z.number().optional().describe('Filter by minimum price'),
  max_price: z.number().optional().describe('Filter by maximum price'),
});

/**
 * Schema for read tool input
 * Supports both reading by ID and searching by query
 */
export const ReadSchema = z.object({
  postType: PostTypeSchema.describe('The type of post to read (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID for single post retrieval'),
  query: z.string().optional().describe('Search query string'),
  // Common filters at top level
  page: z.number().optional().describe('Page number'),
  per_page: z.number().optional().describe('Items per page'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  orderby: z.string().optional().describe('Field to order by'),
  status: z.union([z.string(), z.array(z.string())]).optional().describe('Post status filter'),
  include: z.array(z.number()).optional().describe('Include specific IDs'),
  exclude: z.array(z.number()).optional().describe('Exclude specific IDs'),
  // Post-type specific filters
  eventFilters: EventFiltersSchema.optional().describe('Event-specific filters (only used when postType is "event")'),
  venueFilters: VenueFiltersSchema.optional().describe('Venue-specific filters (only used when postType is "venue")'),
  organizerFilters: OrganizerFiltersSchema.optional().describe('Organizer-specific filters (only used when postType is "organizer")'),
  ticketFilters: TicketFiltersSchema.optional().describe('Ticket-specific filters (only used when postType is "ticket")'),
});

/**
 * Input shape for MCP SDK
 */
export const ReadInputSchema = {
  postType: PostTypeSchema.describe('The type of post to read (event, venue, organizer, or ticket)'),
  id: z.number().optional().describe('Post ID for single post retrieval'),
  query: z.string().optional().describe('Search query string'),
  // Common filters at top level
  page: z.number().optional().describe('Page number'),
  per_page: z.number().optional().describe('Items per page'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  orderby: z.string().optional().describe('Field to order by'),
  status: z.union([z.string(), z.array(z.string())]).optional().describe('Post status filter'),
  include: z.array(z.number().int().positive()).optional().describe('Include specific IDs'),
  exclude: z.array(z.number().int().positive()).optional().describe('Exclude specific IDs'),
  // Post-type specific filters
  eventFilters: EventFiltersSchema.optional().describe('Event-specific filters (only used when postType is "event")'),
  venueFilters: VenueFiltersSchema.optional().describe('Venue-specific filters (only used when postType is "venue")'),
  organizerFilters: OrganizerFiltersSchema.optional().describe('Organizer-specific filters (only used when postType is "organizer")'),
  ticketFilters: TicketFiltersSchema.optional().describe('Ticket-specific filters (only used when postType is "ticket")'),
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
    const parsedInput = ReadSchema.parse(input);
    const { postType, id, query, page, per_page, order, orderby, status, include, exclude,
            eventFilters, venueFilters, organizerFilters, ticketFilters } = parsedInput;

    let result;
    let resultDescription: string;

    if (id) {
      // Get single post by ID
      result = await apiClient.getPost(postType as PostType, id);
      resultDescription = `Retrieved ${postType} with ID ${id}`;
    } else {
      // Prepare filters based on post type
      let typeSpecificFilters = {};
      
      switch (postType) {
        case 'event':
          typeSpecificFilters = eventFilters || {};
          break;
        case 'venue':
          typeSpecificFilters = venueFilters || {};
          break;
        case 'organizer':
          typeSpecificFilters = organizerFilters || {};
          break;
        case 'ticket':
          typeSpecificFilters = ticketFilters || {};
          break;
      }
      
      // Combine common filters with type-specific filters
      const searchFilters = {
        page,
        per_page,
        order,
        orderby,
        status,
        include,
        exclude,
        search: query,
        ...typeSpecificFilters,
      };

      // List or search posts
      result = await apiClient.listPosts(postType as PostType, searchFilters || {});
      
      const posts = Array.isArray(result) ? result : [result];
      const count = posts.length;
      
      if (query) {
        const searchTerm = query;
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
    // Common filters at top level
    page: { type: 'number' as const, description: 'Page number' },
    per_page: { type: 'number' as const, description: 'Items per page' },
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
    // Post-type specific filters
    eventFilters: {
      type: 'object' as const,
      description: 'Event-specific filters (only used when postType is "event")',
      properties: {
        start_date: { type: 'string' as const, description: 'Event start date filter (YYYY-MM-DD). ⚠️ Call current_datetime tool FIRST to get current date.' },
        end_date: { type: 'string' as const, description: 'Event end date filter (YYYY-MM-DD). ⚠️ Call current_datetime tool FIRST to get current date.' },
        venue: { type: 'number' as const, description: 'Filter by venue ID' },
        organizer: { type: 'number' as const, description: 'Filter by organizer ID' },
        featured: { type: 'boolean' as const, description: 'Filter featured events' },
        categories: { type: 'array' as const, items: { type: 'number' as const }, description: 'Filter by category IDs' },
        tags: { type: 'array' as const, items: { type: 'number' as const }, description: 'Filter by tag IDs' }
      },
      additionalProperties: false
    },
    venueFilters: {
      type: 'object' as const,
      description: 'Venue-specific filters (only used when postType is "venue")',
      properties: {
        city: { type: 'string' as const, description: 'Filter by city' },
        state: { type: 'string' as const, description: 'Filter by state/province' },
        country: { type: 'string' as const, description: 'Filter by country' },
        zip: { type: 'string' as const, description: 'Filter by postal code' },
        geo_lat: { type: 'number' as const, description: 'Filter by latitude (requires geo_lng)' },
        geo_lng: { type: 'number' as const, description: 'Filter by longitude (requires geo_lat)' },
        radius: { type: 'number' as const, description: 'Filter by radius in km (requires geo_lat/geo_lng)' }
      },
      additionalProperties: false
    },
    organizerFilters: {
      type: 'object' as const,
      description: 'Organizer-specific filters (only used when postType is "organizer")',
      properties: {
        email: { type: 'string' as const, description: 'Filter by email' },
        website: { type: 'string' as const, description: 'Filter by website' },
        phone: { type: 'string' as const, description: 'Filter by phone' }
      },
      additionalProperties: false
    },
    ticketFilters: {
      type: 'object' as const,
      description: 'Ticket-specific filters (only used when postType is "ticket")',
      properties: {
        event: { type: 'number' as const, description: 'Filter by event ID' },
        provider: { type: 'string' as const, description: 'Filter by provider (RSVP, Ticket Commerce, WooCommerce)' },
        type: { type: 'string' as const, enum: ['rsvp', 'paid'], description: 'Filter by ticket type' },
        available: { type: 'boolean' as const, description: 'Filter by availability' },
        min_price: { type: 'number' as const, description: 'Filter by minimum price' },
        max_price: { type: 'number' as const, description: 'Filter by maximum price' }
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

⚠️ IMPORTANT: When filtering events by date (e.g., "events this week", "upcoming events"), ALWAYS call the current_datetime tool FIRST to get the current date and calculate the appropriate date filters. Never assume or hardcode dates.

Use cases:
1. Get single post: provide postType and id
2. List all posts: provide postType only
3. Search posts: provide postType and query
4. Filter by dates: FIRST call current_datetime tool, THEN apply filters

Examples:

// Get single event
{"postType": "event", "id": 123}

// List all venues with pagination
{"postType": "venue", "per_page": 10}

// Search events with date filter (after calling current_datetime)
{"postType": "event", "query": "conference", "eventFilters": {"start_date": "2024-12-01"}}

// Filter venues by location
{"postType": "venue", "venueFilters": {"city": "San Francisco", "state": "CA"}}

// List available tickets for an event
{"postType": "ticket", "ticketFilters": {"event": 123, "available": true}}`,
  inputSchema: ReadInputSchema,
  jsonSchema: ReadJsonSchema,
};