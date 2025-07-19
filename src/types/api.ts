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

export interface ApiFilters {
  page?: number;
  per_page?: number;
  search?: string;
  order?: 'asc' | 'desc';
  orderby?: string;
  status?: string | string[];
  include?: number[];
  exclude?: number[];
  [key: string]: any;
}