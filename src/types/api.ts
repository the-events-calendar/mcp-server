/**
 * WordPress REST API response types
 */

export interface WPError {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: Record<string, string>;
    details?: Record<string, any>;
  };
}

export interface ListResponse<T> {
  events?: T[];     // For events endpoint
  venues?: T[];     // For venues endpoint
  organizers?: T[]; // For organizers endpoint
  tickets?: T[];    // For tickets endpoint
  rest_url: string;
  total: number;
  total_pages: number;
  next_rest_url?: string;
  previous_rest_url?: string;
}

// Single items are returned directly without wrapper
// The Events Calendar API returns single items as the direct response
// without any wrapping object, so we don't need a SingleResponse interface

export interface DeleteResponse {
  deleted: boolean;
  previous: any;
}

/**
 * Base filters common to all post types
 */
export interface BaseFilters {
  page?: number;
  per_page?: number;
  search?: string;
  order?: 'asc' | 'desc';
  orderby?: string;
  status?: string | string[];
  include?: number[];
  exclude?: number[];
}

/**
 * Event-specific filters
 */
export interface EventFilters extends BaseFilters {
  start_date?: string;      // Filter by start date (YYYY-MM-DD)
  end_date?: string;        // Filter by end date (YYYY-MM-DD)
  venue?: number;           // Filter by venue ID
  organizer?: number;       // Filter by organizer ID
  featured?: boolean;       // Filter featured events
  categories?: number[];    // Filter by category IDs
  tags?: number[];          // Filter by tag IDs
}

/**
 * Venue-specific filters
 */
export interface VenueFilters extends BaseFilters {
  city?: string;            // Filter by city
  state?: string;           // Filter by state/province
  country?: string;         // Filter by country
  zip?: string;             // Filter by postal code
  geo_lat?: number;         // Filter by latitude (with geo_lng)
  geo_lng?: number;         // Filter by longitude (with geo_lat)
  radius?: number;          // Filter by radius (with geo_lat/geo_lng)
}

/**
 * Organizer-specific filters
 */
export interface OrganizerFilters extends BaseFilters {
  email?: string;           // Filter by email
  website?: string;         // Filter by website
  phone?: string;           // Filter by phone
}

/**
 * Ticket-specific filters
 */
export interface TicketFilters extends BaseFilters {
  event?: number;           // Filter by event ID
  provider?: string;        // Filter by provider (RSVP, Ticket Commerce, WooCommerce)
  type?: 'rsvp' | 'paid';   // Filter by ticket type
  available?: boolean;      // Filter by availability
  min_price?: number;       // Filter by minimum price
  max_price?: number;       // Filter by maximum price
}

/**
 * Map post types to their filter types
 */
export interface FilterTypeMap {
  event: EventFilters;
  venue: VenueFilters;
  organizer: OrganizerFilters;
  ticket: TicketFilters;
}

/**
 * Union type for all filter types
 */
export type ApiFilters = EventFilters | VenueFilters | OrganizerFilters | TicketFilters;

/**
 * Type guard functions
 */
export function isEventFilters(filters: ApiFilters): filters is EventFilters {
  return 'start_date' in filters || 'end_date' in filters || 'venue' in filters;
}

export function isVenueFilters(filters: ApiFilters): filters is VenueFilters {
  return 'city' in filters || 'state' in filters || 'country' in filters;
}

export function isOrganizerFilters(filters: ApiFilters): filters is OrganizerFilters {
  return 'email' in filters || 'website' in filters || 'phone' in filters;
}

export function isTicketFilters(filters: ApiFilters): filters is TicketFilters {
  return 'event' in filters || 'provider' in filters || 'type' in filters;
}