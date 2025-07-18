import { z } from 'zod';

/**
 * Base post schema with common WordPress fields
 */
export const BasePostSchema = z.object({
  id: z.number().int().positive().describe('Unique identifier for the post').optional(),
  title: z.string().describe('The title of the post').optional(),
  slug: z.string().describe('URL-friendly version of the title').optional(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'trash'])
    .describe('Publication status of the post'),
  date: z.string().describe('Publication date in site timezone'),
  date_gmt: z.string().describe('Publication date in GMT'),
  modified: z.string().describe('Last modified date in site timezone'),
  modified_gmt: z.string().describe('Last modified date in GMT'),
  link: z.string().optional().describe('Full URL to the post'),
  type: z.string().describe('WordPress post type identifier'),
}).meta({
  title: 'Base Post',
  description: 'Common fields shared by all WordPress post types',
});

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
export type BasePost = z.infer<typeof BasePostSchema>;
export type PostType = z.infer<typeof PostTypeSchema>;