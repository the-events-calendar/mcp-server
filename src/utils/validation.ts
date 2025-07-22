import { z } from 'zod';
import { PostType, PostTypeSchema } from '../types/schemas/index.js';

// Re-export PostTypeSchema from schemas
export { PostTypeSchema };

/**
 * Base fields that can be updated on all post types
 */
export const BasePostUpdateSchema = z.object({
  title: z.string().optional().describe('The title of the post'),
  status: z.enum(['publish', 'draft', 'pending', 'private'])
    .default('publish')
    .describe('Publication status of the post'),
  slug: z.string().optional().describe('URL-friendly version of the title'),
  excerpt: z.string().optional().describe('Short text summary'),
  content: z.string().optional().describe('Full HTML content'),
}).meta({
  title: 'Base Post Update',
  description: 'Common fields that can be updated on any post type',
});

/**
 * Event-specific update fields
 */
export const EventDataSchema = BasePostUpdateSchema.extend({
  start_date: z.string().optional()
    .describe('Event start date/time - accepts ISO 8601 format or PHP strtotime() compatible strings like "next monday", "tomorrow 2pm", "+3 days"'),
  end_date: z.string().optional()
    .describe('Event end date/time - accepts ISO 8601 format or PHP strtotime() compatible strings like "next friday 5pm", "tomorrow 11:59pm", "+4 hours"'),
  all_day: z.boolean().optional()
    .describe('Whether this is an all-day event'),
  timezone: z.string().optional()
    .describe('Timezone identifier (e.g., America/New_York)'),
  venue: z.number().optional()
    .describe('ID of the associated venue post'),
  organizers: z.array(z.number()).optional()
    .describe('Array of organizer post IDs'),
  cost: z.string().optional()
    .describe('Cost description or amount'),
  website: z.string().optional()
    .describe('External event website URL'),
  description: z.string().optional()
    .describe('Full HTML description of the event'),
  categories: z.array(z.number()).optional()
    .describe('Array of category term IDs'),
  tags: z.array(z.number()).optional()
    .describe('Array of tag term IDs'),
}).meta({
  title: 'Event Update Data',
  description: 'Fields that can be updated on an event post',
});

/**
 * Venue-specific update fields
 */
export const VenueDataSchema = BasePostUpdateSchema.extend({
  venue: z.string().optional()
    .describe('Venue name (may differ from post title)'),
  address: z.string().optional()
    .describe('Street address'),
  city: z.string().optional()
    .describe('City name'),
  state_province: z.string().optional()
    .describe('State or province name'),
  zip: z.string().optional()
    .describe('ZIP or postal code'),
  country: z.string().optional()
    .describe('Country name or code'),
  phone: z.string().optional()
    .describe('Contact phone number'),
  website: z.string().optional()
    .describe('Venue website URL'),
}).meta({
  title: 'Venue Update Data',
  description: 'Fields that can be updated on a venue post',
});

/**
 * Organizer-specific update fields
 */
export const OrganizerDataSchema = BasePostUpdateSchema.extend({
  organizer: z.string().optional()
    .describe('Organizer name (may differ from post title)'),
  phone: z.string().optional()
    .describe('Contact phone number'),
  website: z.string().optional()
    .describe('Organizer website URL'),
  email: z.string().optional()
    .describe('Contact email address'),
}).meta({
  title: 'Organizer Update Data',
  description: 'Fields that can be updated on an organizer post',
});

/**
 * Ticket-specific update fields
 */
export const TicketDataSchema = BasePostUpdateSchema.extend({
  event: z.number().optional()
    .describe('ID of the associated event'),
  price: z.string().optional()
    .describe('Ticket price (formatted with currency)'),
  stock: z.number().optional()
    .describe('Total number of tickets available'),
  capacity: z.number().optional()
    .describe('Maximum capacity for this ticket type'),
  sku: z.string().optional()
    .describe('Stock keeping unit for inventory tracking'),
}).meta({
  title: 'Ticket Update Data',
  description: 'Fields that can be updated on a ticket post',
});

/**
 * Get the appropriate update schema for a post type
 */
export function getSchemaForPostType(postType: PostType) {
  switch (postType) {
    case 'event':
      return EventDataSchema;
    case 'venue':
      return VenueDataSchema;
    case 'organizer':
      return OrganizerDataSchema;
    case 'ticket':
      return TicketDataSchema;
    default:
      return BasePostUpdateSchema;
  }
}