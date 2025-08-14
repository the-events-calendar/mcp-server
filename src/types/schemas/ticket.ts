import { z } from 'zod';
import { BasePostResponseSchema, BasePostRequestSchema } from './base.js';

/**
 * Ticket availability schema
 */
const TicketAvailabilitySchema = z.object({
  status: z.enum(['available', 'sold_out', 'unavailable'])
    .describe('Current availability status'),
  available: z.number().describe('Number of tickets currently available'),
  sold: z.number().describe('Number of tickets sold'),
  pending: z.number().describe('Number of tickets in pending transactions'),
}).meta({
  title: 'Ticket Availability',
  description: 'Real-time ticket inventory and sales information',
});

/**
 * Ticket response schema (includes read-only fields)
 */
export const TicketResponseSchema = BasePostResponseSchema.extend({
  type: z.union([
    z.literal('tribe_rsvp_tickets'),
    z.literal('tec_tc_ticket'),
    z.literal('default'), // For the new API
  ]).describe('Ticket post type identifier (RSVP or paid ticket)'),
  event: z.number().optional().describe('ID of the associated event'),
  price: z.union([z.string(), z.number()]).optional().describe('Ticket price (formatted with currency or number)'),
  stock: z.number().optional().describe('Total number of tickets available'),
  capacity: z.number().optional().describe('Maximum capacity for this ticket type'),
  event_capacity: z.number().optional().describe('Maximum capacity for the entire event'),
  availability: TicketAvailabilitySchema.optional()
    .describe('Current availability information'),
  sku: z.string().optional().describe('Stock keeping unit for inventory tracking'),
  provider: z.string().optional().describe('Ticketing provider (defaults to "Tickets Commerce", alternatives: RSVP, WooCommerce)'),
  rsvp: z.boolean().optional().describe('Whether this is a free RSVP ticket'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Date must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00")').optional().describe('When ticket sales start (must be in Y-m-d H:i:s format) - tickets not visible before this'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Date must be in Y-m-d H:i:s format (e.g., "2024-12-25 23:59:59")').optional().describe('When ticket sales end (must be in Y-m-d H:i:s format) - tickets not available after this'),
  manage_stock: z.boolean().optional().describe('Enable inventory tracking'),
  show_description: z.boolean().optional().describe('Display description on frontend'),
  sale_price: z.union([z.string(), z.number()]).optional().describe('Discounted/sale price'),
  sale_price_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format (e.g., "2024-12-01")').optional().describe('When sale price starts (must be in YYYY-MM-DD format)'),
  sale_price_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format (e.g., "2024-12-15")').optional().describe('When sale price ends (must be in YYYY-MM-DD format)'),
  stock_mode: z.enum(['own', 'global', 'capped']).optional().describe('Stock management mode for the ticket'),
  attendee_collection: z.enum(['allowed', 'required', 'disabled']).optional().describe('Whether attendee information collection is allowed/required'),
  sold: z.number().optional().describe('Number of tickets already sold (read-only)'),
  on_sale: z.boolean().optional().describe('Whether the ticket is currently on sale (read-only)'),
  event_id: z.number().optional().describe('ID of the associated event (alternative to event field)'),
  description: z.string().optional().describe('Ticket description text'),
}).meta({
  title: 'Ticket Response',
  description: 'Event ticket as returned by the API, including read-only fields like sold count and calculated values.',
  examples: [
    {
      id: 101,
      title: 'General Admission',
      slug: 'general-admission',
      status: 'publish',
      type: 'default',
      event: 123,
      price: 25.00,
      stock: 100,
      capacity: 100,
      event_capacity: 150,
      sku: 'GA-2024-001',
      show_description: true,
      stock_mode: 'own',
      attendee_collection: 'allowed',
    },
    {
      id: 102,
      title: 'VIP Pass',
      slug: 'vip-pass',
      status: 'publish',
      type: 'default',
      event: 123,
      price: 150.00,
      regular_price: 150.00,
      sale_price: 120.00,
      sale_price_start_date: '2024-12-01',
      sale_price_end_date: '2024-12-15',
      on_sale: true,
      stock: 20,
      sold: 10,
      capacity: 30,
      event_capacity: 150,
      availability: {
        status: 'available',
        available: 10,
        sold: 10,
        pending: 0,
      },
      sku: 'VIP-2024-001',
      description: 'Includes premium seating and exclusive access',
      show_description: true,
      stock_mode: 'own',
      attendee_collection: 'required',
    },
    {
      id: 103,
      title: 'Free Community RSVP',
      slug: 'free-community-rsvp',
      status: 'publish',
      type: 'tribe_rsvp_tickets',
      event: 124,
      price: 'Free',
      stock: 500,
      capacity: 500,
      rsvp: true,
      provider: 'RSVP',
    },
    {
      id: 104,
      title: 'Early Bird Special',
      slug: 'early-bird-special',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 125,
      price: '$45.00',
      stock: 50,
      capacity: 50,
      availability: {
        status: 'sold_out',
        available: 0,
        sold: 50,
        pending: 0,
      },
      sku: 'EB-CONF-2024',
    },
    {
      id: 105,
      title: 'Student Discount',
      slug: 'student-discount',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 126,
      price: '$15.00',
      stock: 75,
      capacity: 100,
      availability: {
        status: 'available',
        available: 25,
        sold: 70,
        pending: 5,
      },
      sku: 'STU-DISC-001',
      provider: 'WooCommerce',
    },
    {
      id: 106,
      title: 'Group Package (10 people)',
      slug: 'group-package-10',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 127,
      price: '$200.00',
      stock: 10,
      capacity: 10,
      sku: 'GRP-10-PKG',
    },
    {
      id: 107,
      title: 'Workshop Registration',
      slug: 'workshop-registration',
      status: 'draft',
      type: 'tribe_rsvp_tickets',
      event: 128,
      stock: 30,
      capacity: 30,
      rsvp: true,
      availability: {
        status: 'available',
        available: 30,
        sold: 0,
        pending: 0,
      },
    },
    {
      id: 108,
      title: 'Premium Seating',
      slug: 'premium-seating',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 129,
      price: '€75.00',
      stock: 40,
      capacity: 50,
      availability: {
        status: 'available',
        available: 15,
        sold: 25,
        pending: 0,
      },
      sku: 'PREM-SEAT-EU',
      provider: 'WooCommerce',
    },
    {
      id: 109,
      title: 'Livestream Access',
      slug: 'livestream-access',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 130,
      price: '$10.00',
      stock: 1000,
      capacity: 1000,
      sku: 'LIVE-STREAM-001',
      provider: 'WooCommerce',
    },
    {
      id: 110,
      title: 'Sponsor Table',
      slug: 'sponsor-table',
      status: 'private',
      type: 'tec_tc_ticket',
      event: 131,
      price: '$5000.00',
      stock: 8,
      capacity: 10,
      availability: {
        status: 'available',
        available: 2,
        sold: 6,
        pending: 0,
      },
      sku: 'SPONSOR-TABLE',
    },
    {
      id: 111,
      title: 'Day Pass',
      slug: 'day-pass',
      status: 'publish',
      type: 'tec_tc_ticket',
      event: 132,
      price: '¥3500',
      stock: 200,
      capacity: 200,
      provider: 'WooCommerce',
      sku: 'DAY-PASS-JP',
    },
    {
      id: 112,
      title: 'Waitlist Registration',
      slug: 'waitlist-registration',
      status: 'publish',
      type: 'tribe_rsvp_tickets',
      event: 133,
      rsvp: true,
      availability: {
        status: 'unavailable',
        available: 0,
        sold: 100,
        pending: 0,
      },
    },
  ],
});

/**
 * Ticket request schema (only fields that can be set/modified)
 */
export const TicketRequestSchema = BasePostRequestSchema.extend({
  // Ticket-specific fields that can be set
  type: z.union([
    z.literal('tribe_rsvp_tickets'),
    z.literal('tec_tc_ticket'),
    z.literal('default'), // For the new API
  ]).describe('Ticket post type identifier (RSVP or paid ticket)').optional(),
  event: z.number().optional().describe('ID of the associated event'),
  price: z.union([z.string(), z.number()]).optional().describe('Ticket price (formatted with currency or number)'),
  sale_price: z.union([z.string(), z.number()]).optional().describe('Discounted/sale price'),
  sale_price_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format (e.g., "2024-12-01")').optional().describe('When sale price starts (must be in YYYY-MM-DD format)'),
  sale_price_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format (e.g., "2024-12-15")').optional().describe('When sale price ends (must be in YYYY-MM-DD format)'),
  stock: z.number().optional().describe('Total number of tickets available'),
  capacity: z.number().optional().describe('Maximum capacity for this ticket type'),
  event_capacity: z.number().optional().describe('Maximum capacity for the entire event'),
  sku: z.string().optional().describe('Stock keeping unit for inventory tracking'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Date must be in Y-m-d H:i:s format (e.g., "2024-12-25 15:30:00")').optional().describe('When ticket sales start (must be in Y-m-d H:i:s format) - tickets not visible before this'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, 'Date must be in Y-m-d H:i:s format (e.g., "2024-12-25 23:59:59")').optional().describe('When ticket sales end (must be in Y-m-d H:i:s format) - tickets not available after this'),
  manage_stock: z.boolean().optional().describe('Enable inventory tracking'),
  show_description: z.boolean().optional().describe('Display description on frontend'),
  description: z.string().optional().describe('Ticket description text'),
  stock_mode: z.enum(['own', 'global', 'capped']).optional().describe('Stock management mode for the ticket'),
  attendee_collection: z.enum(['allowed', 'required', 'disabled']).optional().describe('Whether attendee information collection is allowed/required'),
}).meta({
  title: 'Ticket Request',
  description: 'Event ticket data for create/update operations. Read-only fields like sold count and on_sale status are calculated by the API.',
});

/**
 * Legacy schema export for backward compatibility
 */
export const TicketSchema = TicketResponseSchema;

/**
 * Type exports
 */
export type TicketResponse = z.infer<typeof TicketResponseSchema>;
export type TicketRequest = z.infer<typeof TicketRequestSchema>;
export type Ticket = TicketResponse; // Backward compatibility
