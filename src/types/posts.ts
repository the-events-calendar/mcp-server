/**
 * Base interface for all WordPress post types
 */
export interface BasePost {
  id: number;
  title: string;
  slug: string;
  status: 'publish' | 'draft' | 'pending' | 'private' | 'trash' | 'future';
  date: string;
  date_gmt: string;
  modified?: string;
  modified_gmt?: string;
  link?: string;
  type: string;
  content?: string;
  excerpt?: string;
  author?: number;
  featured_media?: number;
  comment_status?: 'open' | 'closed';
  ping_status?: 'open' | 'closed';
  format?: string;
  sticky?: boolean;
  template?: string;
  tags?: number[];
}

/**
 * Event post type from The Events Calendar
 */
export interface Event extends BasePost {
  type: 'tribe_events';
  start_date: string;
  start_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  end_date: string;
  end_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  all_day: boolean;
  timezone: string;
  venues?: number[];
  organizers?: number[];
  cost?: string;
  cost_details?: {
    currency_symbol: string;
    currency_code: string;
    values: string[];
  };
  website?: string;
  description?: string;
  excerpt?: string;
  image?: {
    url: string;
    id: number;
    width: number;
    height: number;
  };
  categories?: number[];
  tags?: number[];
}

/**
 * Venue post type from The Events Calendar
 */
export interface Venue extends BasePost {
  type: 'tribe_venue';
  venue?: string;
  address?: string;
  city?: string;
  state_province?: string;
  state?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  stateprovince?: string;
  geo_lat?: number;
  geo_lng?: number;
}

/**
 * Organizer post type from The Events Calendar
 */
export interface Organizer extends BasePost {
  type: 'tribe_organizer';
  organizer?: string;
  phone?: string;
  website?: string;
  email?: string;
}

/**
 * Ticket post type from Event Tickets
 */
export interface Ticket extends BasePost {
  type: 'tribe_rsvp_tickets' | 'tec_tc_ticket' | 'default';
  event?: number;
  event_id?: number;
  price?: string | number;
  stock?: number;
  capacity?: number;
  event_capacity?: number;
  availability?: {
    status: 'available' | 'sold_out' | 'unavailable';
    available: number;
    sold: number;
    pending: number;
  };
  sku?: string;
  provider?: string;
  rsvp?: boolean;
  start_date?: string;
  end_date?: string;
  manage_stock?: boolean;
  show_description?: boolean;
  sale_price?: string | number;
  sale_price_start_date?: string;
  sale_price_end_date?: string;
  stock_mode?: 'own' | 'global' | 'capped';
  attendee_collection?: 'allowed' | 'required' | 'disabled';
  sold?: number;
  on_sale?: boolean;
  description?: string;
}

/**
 * Union type for all supported post types
 */
export type SupportedPost = Event | Venue | Organizer | Ticket;

/**
 * Post type names
 */
export type PostType = 'event' | 'venue' | 'organizer' | 'ticket';

/**
 * Map post type to interface
 */
export interface PostTypeMap {
  event: Event;
  venue: Venue;
  organizer: Organizer;
  ticket: Ticket;
}
