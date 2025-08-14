// Re-export types from schemas folder
export type {
  BasePost,
  BasePostRequest,
  BasePostResponse,
  Event,
  Venue,
  Organizer,
  Ticket,
  TicketRequest,
  TicketResponse,
  SupportedPost,
  PostType,
  PostTypeMap,
} from './schemas/index.js';

// Keep exporting schemas as well
export {
  BasePostSchema,
  BasePostRequestSchema,
  BasePostResponseSchema,
  EventSchema,
  VenueSchema,
  OrganizerSchema,
  TicketSchema,
  TicketRequestSchema,
  TicketResponseSchema,
  SupportedPostSchema,
  PostTypeSchema,
  getSchemaForPostType,
  getRequestSchemaForPostType,
} from './schemas/index.js';

// Keep exporting API types
export * from './api.js';