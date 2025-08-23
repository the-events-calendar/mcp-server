import { PostType, PostTypeMap, FilterTypeMap, WPError } from '../types/index.js';
import { ApiError, isApiError } from '../utils/error-handling.js';
import { buildEndpoint } from './endpoints.js';
import { fetch as undiciFetch, Agent } from 'undici';
import { getLogger } from '../utils/logger.js';

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
  private logger;

  constructor(private config: ApiClientConfig) {
    // Get logger instance in constructor to ensure it's properly configured
    this.logger = getLogger();
    
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
   * Expose the configured base URL for instructions/logging.
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
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
        // Add experimental endpoint acknowledgement header for TEC v1 API
        'X-TEC-EEA': 'I understand that this endpoint is experimental and may change in a future release without maintaining backward compatibility. I also understand that I am using this endpoint at my own risk, while support is not provided for it.',
        ...options.headers,
      },
    };

    this.logger.http(`API Request: ${options.method || 'GET'} ${url}`);
    this.logger.debug('Request headers:', {
      ...fetchOptions.headers,
      Authorization: '[REDACTED]'
    });
    if (options.body) {
      this.logger.debug('Request body:', options.body);
    }
    this.logger.silly(`SSL verification: ${this.config.ignoreSslErrors ? 'DISABLED' : 'enabled'}`);

    // Add dispatcher if configured
    if (this.dispatcher) {
      fetchOptions.dispatcher = this.dispatcher;
      this.logger.silly('Using custom dispatcher with SSL ignore');
    }

    try {
      const startTime = Date.now();
      const response = await fetch(url, fetchOptions);
      const duration = Date.now() - startTime;

      this.logger.http(`API Response: ${response.status} ${response.statusText} (${duration}ms)`);
      this.logger.debug('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();

      if (response.ok) {
        this.logger.silly('Response body:', data);
      } else {
        this.logger.error('Error response:', data);
        throw ApiError.fromWPError(data as WPError, response.status);
      }

      return data as T;
    } catch (error: any) {
      this.logger.error('Request error:', error.message);
      if (error.cause) {
        this.logger.error('Error cause:', error.cause);
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
    filters: FilterTypeMap[T] = {} as FilterTypeMap[T]
  ): Promise<PostTypeMap[T][]> {
    const endpoint = buildEndpoint(postType);
    const params = new URLSearchParams();

    // Apply per_page limit if enforced (default: true)
    const enforceLimit = this.config.enforcePerPageLimit !== false;
    const processedFilters = { ...filters };

    if (enforceLimit && processedFilters.per_page && processedFilters.per_page > 100) {
      this.logger.warn(`per_page value ${processedFilters.per_page} exceeds maximum allowed (100). Limiting to 100.`);
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

    // The new TEC v1 API returns arrays directly, not wrapped in resource keys
    const response = await this.request<PostTypeMap[T][]>(url);

    return response || [];
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
    filters: FilterTypeMap[T] = {} as FilterTypeMap[T]
  ): Promise<PostTypeMap[T][]> {
    return this.listPosts(postType, {
      ...filters,
      search: query,
    } as FilterTypeMap[T]);
  }

  /**
   * Get site information and verify REST API availability.
   */
  async getSiteInfo(): Promise<any> {
    // First, hit the REST API root to verify it's reachable and get basic info
    try {
      const rootInfo = await this.request<any>('/wp-json/');

      // Check authentication with an endpoint that requires auth
      let authValid = false;
      let authStatusCode: number | undefined;
      const failedChecks: Array<{ step: string; endpoint: string; statusCode?: number; message?: string }> = [];
      try {
        await this.request<any>('/wp-json/wp/v2/users/me');
        authValid = true;
      } catch (authErr) {
        if (isApiError(authErr)) {
          authStatusCode = authErr.statusCode;
        }
        failedChecks.push({
          step: 'auth',
          endpoint: '/wp/v2/users/me',
          statusCode: authStatusCode,
          message: (authErr as Error)?.message,
        });
      }

      // Optionally enrich with site settings if available (requires auth). We still try even if authValid=false to capture specific status.
      try {
        const settings = await this.request<any>('/wp-json/wp/v2/settings');
        authValid = true;
        return {
          // Prefer settings.title when present, otherwise fall back to root name
          title: settings?.title ?? rootInfo?.name,
          name: rootInfo?.name ?? settings?.title,
          description: rootInfo?.description,
          url: rootInfo?.url,
          home: rootInfo?.home,
          gmt_offset: settings?.gmt_offset ?? rootInfo?.gmt_offset,
          timezone_string: settings?.timezone_string ?? rootInfo?.timezone_string,
          authError: !authValid,
          authValid,
          restReachable: true,
          settingsAccessible: true,
          failedChecks: failedChecks.length ? failedChecks : undefined,
        };
      } catch (settingsError) {
        // If settings are not accessible, still consider auth valid if users/me succeeded.
        const settingsStatus = isApiError(settingsError) ? settingsError.statusCode : undefined;
        if (settingsStatus) {
          this.logger.info(`Settings endpoint not accessible (status ${settingsStatus}). Proceeding with limited permissions.`);
        }
        failedChecks.push({
          step: 'settings',
          endpoint: '/wp/v2/settings',
          statusCode: settingsStatus,
          message: (settingsError as Error)?.message,
        });
        return {
          title: rootInfo?.name,
          name: rootInfo?.name,
          description: rootInfo?.description,
          url: rootInfo?.url,
          home: rootInfo?.home,
          gmt_offset: rootInfo?.gmt_offset,
          timezone_string: rootInfo?.timezone_string,
          authError: !authValid,
          authStatusCode: authStatusCode,
          authValid,
          restReachable: true,
          settingsAccessible: false,
          settingsStatusCode: settingsStatus,
          failedChecks: failedChecks.length ? failedChecks : undefined,
        };
      }
    } catch (rootError) {
      // Could not reach REST API root; treat as not operational
      const isAuth = isApiError(rootError) && (rootError.statusCode === 401 || rootError.statusCode === 403);
      return {
        authError: isAuth,
        authStatusCode: isApiError(rootError) ? rootError.statusCode : undefined,
        authValid: isAuth ? false : undefined,
        restReachable: false,
        failedChecks: [{
          step: 'root',
          endpoint: '/wp-json/',
          statusCode: isApiError(rootError) ? rootError.statusCode : undefined,
          message: (rootError as Error)?.message,
        }],
      };
    }
  }
}
