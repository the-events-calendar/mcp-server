// Re-export types from schemas folder
export type {
  BasePost,
  Event,
  Venue,
  Organizer,
  Ticket,
  SupportedPost,
  PostType,
  PostTypeMap,
} from './schemas/index.js';

// Keep exporting schemas as well
export {
  BasePostSchema,
  EventSchema,
  VenueSchema,
  OrganizerSchema,
  TicketSchema,
  SupportedPostSchema,
  PostTypeSchema,
  getSchemaForPostType,
} from './schemas/index.js';

// Keep exporting API types
export * from './api.js';