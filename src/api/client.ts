import { PostType, PostTypeMap, ApiFilters, WPError } from '../types/index.js';
import { ApiError } from '../utils/error-handling.js';
import { buildEndpoint } from './endpoints.js';
import { fetch, Agent } from 'undici';

export interface ApiClientConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
  ignoreSslErrors?: boolean;
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
          rejectUnauthorized: false
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
    }
    
    const response = await fetch(url, fetchOptions);

    const data = await response.json();

    if (!response.ok) {
      throw ApiError.fromWPError(data as WPError, response.status);
    }

    return data as T;
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

    // Add filters as query parameters
    Object.entries(filters).forEach(([key, value]) => {
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

    return this.request<PostTypeMap[T][]>(url);
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