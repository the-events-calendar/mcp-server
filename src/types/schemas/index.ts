import { z } from 'zod';
import { PostType } from './base.js';

// Re-export all schemas
export {
  BasePostSchema,
  BasePostRequestSchema,
  BasePostResponseSchema,
  PostTypeSchema
} from './base.js';
export { EventSchema } from './event.js';
export { VenueSchema } from './venue.js';
export { OrganizerSchema, OrganizerRequestSchema } from './organizer.js';
export {
  TicketSchema,
  TicketRequestSchema,
  TicketResponseSchema
} from './ticket.js';

// Re-export all types
export type {
  BasePost,
  BasePostRequest,
  BasePostResponse,
  PostType
} from './base.js';
export type { Event } from './event.js';
export type { Venue } from './venue.js';
export type { Organizer, OrganizerRequest } from './organizer.js';
export type {
  Ticket,
  TicketRequest,
  TicketResponse
} from './ticket.js';

// Import schemas for union and utility functions
import { EventSchema } from './event.js';
import { VenueSchema } from './venue.js';
import { OrganizerSchema, OrganizerRequestSchema } from './organizer.js';
import { TicketSchema, TicketRequestSchema } from './ticket.js';

/**
 * Union schema for all supported post types
 */
export const SupportedPostSchema = z.discriminatedUnion('type', [
  EventSchema,
  VenueSchema,
  OrganizerSchema,
  TicketSchema,
]).meta({
  title: 'Supported Post',
  description: 'Any of the supported WordPress post types for The Events Calendar',
});

/**
 * Type export for supported posts
 */
export type SupportedPost = z.infer<typeof SupportedPostSchema>;

/**
 * Post type map interface
 */
export interface PostTypeMap {
  event: z.infer<typeof EventSchema>;
  venue: z.infer<typeof VenueSchema>;
  organizer: z.infer<typeof OrganizerSchema>;
  ticket: z.infer<typeof TicketSchema>;
}

/**
 * Get the Zod schema for a specific post type (response/read operations)
 */
export function getSchemaForPostType(postType: PostType) {
  switch (postType) {
    case 'event':
      return EventSchema;
    case 'venue':
      return VenueSchema;
    case 'organizer':
      return OrganizerSchema;
    case 'ticket':
      return TicketSchema; // This is TicketResponseSchema
  }
}

/**
 * Get the Zod request schema for a specific post type (create/update operations)
 */
export function getRequestSchemaForPostType(postType: PostType) {
  switch (postType) {
    case 'event':
      return EventSchema; // TODO: Create EventRequestSchema when needed
    case 'venue':
      return VenueSchema; // TODO: Create VenueRequestSchema when needed
    case 'organizer':
      return OrganizerRequestSchema;
    case 'ticket':
      return TicketRequestSchema;
  }
}
