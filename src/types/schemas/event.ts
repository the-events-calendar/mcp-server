import { z } from 'zod';
import { BasePostSchema } from './base.js';

/**
 * Date details schema for events
 */
const DateDetailsSchema = z.object({
  year: z.string().describe('Year (YYYY format)'),
  month: z.string().describe('Month (MM format)'),
  day: z.string().describe('Day (DD format)'),
  hour: z.string().describe('Hour (HH format, 24-hour)'),
  minutes: z.string().describe('Minutes (mm format)'),
  seconds: z.string().describe('Seconds (ss format)'),
}).meta({
  title: 'Date Details',
  description: 'Detailed breakdown of a date/time value',
});

/**
 * Cost details schema for events
 */
const CostDetailsSchema = z.object({
  currency_symbol: z.string().describe('Currency symbol (e.g., $, €)'),
  currency_code: z.string().describe('ISO 4217 currency code (e.g., USD, EUR)'),
  values: z.array(z.string()).describe('Array of cost values'),
}).meta({
  title: 'Cost Details',
  description: 'Detailed cost information including currency',
});

/**
 * Image schema for events
 */
const ImageSchema = z.object({
  url: z.string().describe('Full URL to the image'),
  id: z.number().describe('WordPress media attachment ID'),
  width: z.number().describe('Image width in pixels'),
  height: z.number().describe('Image height in pixels'),
}).meta({
  title: 'Image',
  description: 'Featured image or thumbnail information',
});

/**
 * Event post type schema
 */
export const EventSchema = BasePostSchema.extend({
  type: z.literal('tribe_events').describe('Event post type identifier'),
  start_date: z.string().describe('Event start date/time - accepts ISO 8601 format or PHP strtotime() compatible strings like "next monday", "tomorrow 2pm", "+3 days"'),
  start_date_details: DateDetailsSchema.describe('Breakdown of the start date'),
  end_date: z.string().describe('Event end date/time - accepts ISO 8601 format or PHP strtotime() compatible strings like "next friday 5pm", "tomorrow 11:59pm", "+4 hours"'),
  end_date_details: DateDetailsSchema.describe('Breakdown of the end date'),
  all_day: z.boolean().describe('Whether this is an all-day event'),
  timezone: z.string().describe('Timezone identifier (e.g., America/New_York)'),
  venue: z.number().optional().describe('ID of the associated venue post'),
  organizers: z.array(z.number()).optional().describe('Array of organizer post IDs'),
  cost: z.string().optional().describe('Cost description or amount'),
  cost_details: CostDetailsSchema.optional().describe('Detailed cost breakdown'),
  website: z.string().optional().describe('External event website URL'),
  description: z.string().optional().describe('Full HTML description of the event'),
  excerpt: z.string().optional().describe('Short text summary of the event'),
  image: ImageSchema.optional().describe('Featured image for the event'),
  categories: z.array(z.number()).optional().describe('Array of category term IDs'),
  tags: z.array(z.number()).optional().describe('Array of tag term IDs'),
}).meta({
  title: 'Event',
  description: 'The Events Calendar event post type with date, location, and ticketing information',
  examples: [
    {
      id: 123,
      title: 'Summer Music Festival',
      slug: 'summer-music-festival',
      status: 'publish',
      type: 'tribe_events',
      start_date: '2024-07-15T18:00:00',
      end_date: '2024-07-15T23:00:00',
      all_day: false,
      timezone: 'America/Los_Angeles',
    },
    {
      id: 124,
      title: 'Conference Next Week',
      slug: 'conference-next-week',
      status: 'publish',
      type: 'tribe_events',
      start_date: 'next monday 9am',
      end_date: 'next friday 5pm',
      all_day: false,
      timezone: 'America/New_York',
      venue: 456,
      organizers: [789],
    },
    {
      id: 125,
      title: 'All Day Workshop',
      slug: 'all-day-workshop',
      status: 'publish',
      type: 'tribe_events',
      start_date: 'tomorrow',
      end_date: 'tomorrow',
      all_day: true,
      timezone: 'Europe/London',
      cost: 'Free',
    },
    {
      id: 126,
      title: 'Monthly Meetup',
      slug: 'monthly-meetup',
      status: 'publish',
      type: 'tribe_events',
      start_date: 'first thursday of next month 6:30pm',
      end_date: 'first thursday of next month 9:00pm',
      all_day: false,
      timezone: 'America/Chicago',
      description: 'Our regular monthly community meetup',
    },
    {
      id: 127,
      title: 'Holiday Party',
      slug: 'holiday-party',
      status: 'draft',
      type: 'tribe_events',
      start_date: 'December 15, 2024 7:00 PM',
      end_date: 'December 15, 2024 11:30 PM',
      all_day: false,
      timezone: 'America/Denver',
      venue: 789,
      cost: '$25 per person',
    },
    {
      id: 128,
      title: 'Weekend Retreat',
      slug: 'weekend-retreat',
      status: 'publish',
      type: 'tribe_events',
      start_date: 'last friday of march 2025',
      end_date: 'last sunday of march 2025',
      all_day: false,
      timezone: 'America/Phoenix',
      website: 'https://example.com/retreat',
    },
    {
      id: 129,
      title: 'Quick Meeting',
      slug: 'quick-meeting',
      status: 'publish',
      type: 'tribe_events',
      start_date: '+2 hours',
      end_date: '+3 hours',
      all_day: false,
      timezone: 'UTC',
    },
    {
      id: 130,
      title: 'Annual Gala',
      slug: 'annual-gala',
      status: 'publish',
      type: 'tribe_events',
      start_date: '2025-02-14 18:00:00',
      end_date: '2025-02-14 23:59:59',
      all_day: false,
      timezone: 'America/Los_Angeles',
      venue: 101,
      organizers: [102, 103],
      cost: '$150',
      categories: [10, 11],
      tags: [20, 21],
    },
    {
      id: 131,
      title: 'Morning Yoga',
      slug: 'morning-yoga',
      status: 'publish',
      type: 'tribe_events',
      start_date: 'next saturday 6:30am',
      end_date: 'next saturday 8:00am',
      all_day: false,
      timezone: 'Asia/Tokyo',
      cost: '¥2000',
    },
    {
      id: 132,
      title: 'Tech Talk',
      slug: 'tech-talk',
      status: 'pending',
      type: 'tribe_events',
      start_date: '3 days',
      end_date: '3 days 1 hour',
      all_day: false,
      timezone: 'Europe/Berlin',
      description: 'Learn about the latest in web development',
      excerpt: 'A technical presentation on modern web technologies',
    },
  ],
});

/**
 * Type export
 */
export type Event = z.infer<typeof EventSchema>;