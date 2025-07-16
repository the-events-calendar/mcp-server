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
  items: T[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

export interface SingleResponse<T> {
  item: T;
}

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