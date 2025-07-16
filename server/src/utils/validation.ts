import { z } from 'zod';
import { PostType } from '../types/index.js';

/**
 * Valid post types
 */
export const PostTypeSchema = z.enum(['event', 'venue', 'organizer', 'ticket']);

/**
 * Base fields that can be updated on all post types
 */
export const BasePostUpdateSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['publish', 'draft', 'pending', 'private']).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
});

/**
 * Event-specific fields
 */
export const EventDataSchema = BasePostUpdateSchema.extend({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  all_day: z.boolean().optional(),
  timezone: z.string().optional(),
  venue: z.number().optional(),
  organizers: z.array(z.number()).optional(),
  cost: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
});

/**
 * Venue-specific fields
 */
export const VenueDataSchema = BasePostUpdateSchema.extend({
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

/**
 * Organizer-specific fields
 */
export const OrganizerDataSchema = BasePostUpdateSchema.extend({
  organizer: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
});

/**
 * Ticket-specific fields
 */
export const TicketDataSchema = BasePostUpdateSchema.extend({
  event: z.number().optional(),
  price: z.string().optional(),
  stock: z.number().optional(),
  capacity: z.number().optional(),
  sku: z.string().optional(),
});

/**
 * Get the appropriate schema for a post type
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