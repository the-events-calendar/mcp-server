import { PostType } from '../types/index.js';

/**
 * Endpoint configuration for each post type
 */
export interface EndpointConfig {
  namespace: string;
  resource: string;
  version: string;
}

/**
 * Map of post types to their REST API endpoints
 */
export const ENDPOINTS: Record<PostType, EndpointConfig> = {
  event: {
    namespace: 'tec',
    resource: 'events',
    version: 'v1'
  },
  venue: {
    namespace: 'tec',
    resource: 'venues',
    version: 'v1'
  },
  organizer: {
    namespace: 'tec',
    resource: 'organizers',
    version: 'v1'
  },
  ticket: {
    namespace: 'tec',
    resource: 'tickets',
    version: 'v1'
  }
};

/**
 * Build a full endpoint URL
 */
export function buildEndpoint(postType: PostType, id?: number): string {
  const config = ENDPOINTS[postType];
  const base = `/wp-json/${config.namespace}/${config.version}/${config.resource}`;
  return id ? `${base}/${id}` : base;
}