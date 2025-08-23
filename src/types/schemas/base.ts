import { z } from 'zod';

/**
 * Base post response schema (includes read-only fields)
 */
export const BasePostResponseSchema = z.object({
  id: z.number().int().positive().describe('Unique identifier for the post').optional(),
  title: z.string().describe('The title of the post').optional(),
  slug: z.string().describe('URL-friendly version of the title').optional(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'trash'])
    .describe('Publication status of the post'),
  date: z.string().describe('Publication date in site timezone'),
  date_gmt: z.string().describe('Publication date in GMT'),
  modified: z.string().describe('Last modified date in site timezone').optional(),
  modified_gmt: z.string().describe('Last modified date in GMT').optional(),
  link: z.string().optional().describe('Full URL to the post'),
  type: z.string().describe('WordPress post type identifier'),
  content: z.string().optional().describe('The content of the post'),
  excerpt: z.string().optional().describe('The excerpt/description of the post'),
  author: z.number().int().positive().optional().describe('ID of the post author'),
  featured_media: z.number().int().optional().describe('ID of the featured media attachment'),
  comment_status: z.enum(['open', 'closed']).optional().describe('Whether comments are allowed'),
  ping_status: z.enum(['open', 'closed']).optional().describe('Whether pings/trackbacks are allowed'),
  format: z.string().optional().describe('Post format'),
  sticky: z.boolean().optional().describe('Whether the post is sticky'),
  template: z.string().optional().describe('Template file to use'),
  tags: z.array(z.number().int().positive()).optional().describe('Array of tag IDs'),
}).meta({
  title: 'Base Post Response',
  description: 'Common fields shared by all WordPress post types in API responses',
});

/**
 * Base post request schema (only fields that can be set/modified)
 */
export const BasePostRequestSchema = z.object({
  id: z.number().int().positive().optional().describe('Post ID (required for updates, omit for creation)'),
  title: z.string().describe('The title of the post').optional(),
  slug: z.string().describe('URL-friendly version of the title').optional(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'trash'])
    .default('publish')
    .describe('Publication status of the post (defaults to "publish" when omitted).'),
  content: z.string().optional().describe('The content of the post'),
  excerpt: z.string().optional().describe('The excerpt/description of the post'),
  author: z.number().int().positive().optional().describe('ID of the post author'),
  featured_media: z.number().int().optional().describe('ID of the featured media attachment'),
  comment_status: z.enum(['open', 'closed']).optional().describe('Whether comments are allowed'),
  ping_status: z.enum(['open', 'closed']).optional().describe('Whether pings/trackbacks are allowed'),
  format: z.string().optional().describe('Post format'),
  sticky: z.boolean().optional().describe('Whether the post is sticky'),
  template: z.string().optional().describe('Template file to use'),
  tags: z.array(z.number().int().positive()).optional().describe('Array of tag IDs'),
}).meta({
  title: 'Base Post Request',
  description: 'Common fields for WordPress post creation/update requests (excludes read-only fields)',
});

/**
 * Legacy schema export for backward compatibility
 */
export const BasePostSchema = BasePostResponseSchema;

/**
 * Post type enum schema
 */
export const PostTypeSchema = z.enum(['event', 'venue', 'organizer', 'ticket'])
  .meta({
    title: 'Post Type',
    description: 'Supported post type identifiers for MCP operations',
  });

/**
 * Type exports - inferred from schemas
 */
export type BasePostResponse = z.infer<typeof BasePostResponseSchema>;
export type BasePostRequest = z.infer<typeof BasePostRequestSchema>;
export type BasePost = BasePostResponse; // Backward compatibility
export type PostType = z.infer<typeof PostTypeSchema>;
