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
    namespace: 'tribe/events',
    resource: 'events',
    version: 'v1'
  },
  venue: {
    namespace: 'tribe/events',
    resource: 'venues',
    version: 'v1'
  },
  organizer: {
    namespace: 'tribe/events',
    resource: 'organizers',
    version: 'v1'
  },
  ticket: {
    namespace: 'tribe/tickets',
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