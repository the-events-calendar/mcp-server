import { PostType, PostTypeMap, ApiFilters, WPError, ListResponse } from '../types/index.js';
import { ApiError } from '../utils/error-handling.js';
import { buildEndpoint, ENDPOINTS } from './endpoints.js';
import { fetch as undiciFetch, Agent } from 'undici';

// Always use undici's fetch for consistent SSL handling
const fetch = undiciFetch;

export interface ApiClientConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
  ignoreSslErrors?: boolean;
  enforcePerPageLimit?: boolean; // Defaults to true, limits per_page to max 100
}

/**
 * WordPress REST API client
 */
export class ApiClient {
  private authHeader: string;
  private dispatcher?: Agent;

  constructor(private config: ApiClientConfig) {
    // Create Basic Auth header
    const credentials = Buffer.from(`${config.username}:${config.appPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
    
    // Create dispatcher if SSL errors should be ignored
    if (config.ignoreSslErrors) {
      this.dispatcher = new Agent({
        connect: {
          rejectUnauthorized: false,
          ca: undefined,
          cert: undefined,
          key: undefined,
          checkServerIdentity: () => undefined
        }
      });
    }
  }

  /**
   * Make an authenticated request to the WordPress REST API
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    
    const debug = process.env.DEBUG;
    if (debug) {
      console.error(`[DEBUG] API Request to: ${url}`);
      console.error(`[DEBUG] SSL verification: ${this.config.ignoreSslErrors ? 'DISABLED' : 'enabled'}`);
    }
    
    // Build fetch options
    const fetchOptions: any = {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };
    
    // Add dispatcher if configured
    if (this.dispatcher) {
      fetchOptions.dispatcher = this.dispatcher;
      if (debug) {
        console.error('[DEBUG] Using custom dispatcher with SSL ignore');
      }
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      if (debug) {
        console.error(`[DEBUG] Response status: ${response.status}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw ApiError.fromWPError(data as WPError, response.status);
      }

      return data as T;
    } catch (error: any) {
      if (debug) {
        console.error('[DEBUG] Request error:', error.message);
        if (error.cause) {
          console.error('[DEBUG] Error cause:', error.cause);
        }
      }
      
      // Re-throw with more context for SSL errors
      if (error.message.includes('certificate') || error.message.includes('self-signed')) {
        throw new Error(
          `SSL Certificate Error: ${error.message}. ` +
          `${this.config.ignoreSslErrors ? 'SSL ignore is enabled but error still occurred.' : 'To ignore SSL errors for local development, set WP_IGNORE_SSL_ERRORS=true'}`
        );
      }
      
      throw error;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost<T extends PostType>(
    postType: T,
    id: number
  ): Promise<PostTypeMap[T]> {
    const endpoint = buildEndpoint(postType, id);
    return this.request<PostTypeMap[T]>(endpoint);
  }

  /**
   * Get a list of posts
   */
  async listPosts<T extends PostType>(
    postType: T,
    filters: ApiFilters = {}
  ): Promise<PostTypeMap[T][]> {
    const endpoint = buildEndpoint(postType);
    const params = new URLSearchParams();

    // Apply per_page limit if enforced (default: true)
    const enforceLimit = this.config.enforcePerPageLimit !== false;
    const processedFilters = { ...filters };
    
    if (enforceLimit && processedFilters.per_page && processedFilters.per_page > 100) {
      console.warn(`[ApiClient] per_page value ${processedFilters.per_page} exceeds maximum allowed (100). Limiting to 100.`);
      processedFilters.per_page = 100;
    }

    // Add filters as query parameters
    Object.entries(processedFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    // The API returns a wrapper object with the data under a key matching the resource type
    const response = await this.request<ListResponse<PostTypeMap[T]>>(url);
    
    // Extract the array from the response based on the resource type
    const resourceKey = ENDPOINTS[postType].resource as keyof ListResponse<PostTypeMap[T]>;
    const data = response[resourceKey] as PostTypeMap[T][] | undefined;
    
    return data || [];
  }

  /**
   * Create a new post
   */
  async createPost<T extends PostType>(
    postType: T,
    data: Partial<PostTypeMap[T]>
  ): Promise<PostTypeMap[T]> {
    const endpoint = buildEndpoint(postType);
    return this.request<PostTypeMap[T]>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing post
   */
  async updatePost<T extends PostType>(
    postType: T,
    id: number,
    data: Partial<PostTypeMap[T]>
  ): Promise<PostTypeMap[T]> {
    const endpoint = buildEndpoint(postType, id);
    return this.request<PostTypeMap[T]>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a post
   */
  async deletePost<T extends PostType>(
    postType: T,
    id: number,
    force: boolean = false
  ): Promise<any> {
    const endpoint = buildEndpoint(postType, id);
    const params = force ? '?force=true' : '';
    return this.request(`${endpoint}${params}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search posts
   */
  async searchPosts<T extends PostType>(
    postType: T,
    query: string,
    filters: ApiFilters = {}
  ): Promise<PostTypeMap[T][]> {
    return this.listPosts(postType, {
      ...filters,
      search: query,
    });
  }
}