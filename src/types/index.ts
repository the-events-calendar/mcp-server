// Re-export types from schemas folder
export type {
  BasePost,
  BasePostRequest,
  BasePostResponse,
  Event,
  EventRequest,
  Venue,
  VenueRequest,
  Organizer,
  OrganizerRequest,
  TicketResponse,
  TicketRequest,
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
  EventRequestSchema,
  VenueSchema,
  VenueRequestSchema,
  OrganizerSchema,
  OrganizerRequestSchema,
  TicketSchema,
  TicketRequestSchema,
  SupportedPostSchema,
  PostTypeSchema,
  getSchemaForPostType,
  getRequestSchemaForPostType,
} from './schemas/index.js';

// Keep exporting API types
export * from './api.js';
