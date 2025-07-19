import { z } from 'zod';
import { BasePostSchema } from './base.js';

/**
 * Organizer post type schema
 */
export const OrganizerSchema = BasePostSchema.extend({
  type: z.literal('tribe_organizer').describe('Organizer post type identifier'),
  organizer: z.string().optional().describe('Organizer name (may differ from post title)'),
  phone: z.string().optional().describe('Contact phone number'),
  website: z.string().optional().describe('Organizer website URL'),
  email: z.string().optional().describe('Contact email address'),
}).meta({
  title: 'Organizer',
  description: 'Person or organization responsible for hosting events',
  examples: [
    {
      id: 789,
      title: 'Local Arts Council',
      slug: 'local-arts-council',
      status: 'publish',
      type: 'tribe_organizer',
      email: 'info@localartscouncil.org',
      website: 'https://localartscouncil.org',
      phone: '(555) 123-4567',
    },
    {
      id: 790,
      title: 'DJ Mike Stevens',
      slug: 'dj-mike-stevens',
      status: 'publish',
      type: 'tribe_organizer',
      organizer: 'Mike Stevens - Professional DJ',
      email: 'bookings@djmikestevens.com',
      phone: '+1-555-DJ-MIKE',
      website: 'https://djmikestevens.example.com',
    },
    {
      id: 791,
      title: 'Tech Innovators Conference Group',
      slug: 'tech-innovators-conference-group',
      status: 'publish',
      type: 'tribe_organizer',
      organizer: 'TechInnov Conference Management',
      email: 'events@techinnovators.io',
      website: 'https://conference.techinnovators.io',
    },
    {
      id: 792,
      title: 'Sarah Johnson',
      slug: 'sarah-johnson',
      status: 'publish',
      type: 'tribe_organizer',
      organizer: 'Sarah Johnson - Yoga Instructor',
      email: 'sarah@mindfulyoga.com',
      phone: '555-YOGA-NOW',
    },
    {
      id: 793,
      title: 'Municipal Recreation Department',
      slug: 'municipal-recreation-department',
      status: 'publish',
      type: 'tribe_organizer',
      phone: '(555) 867-5309',
      email: 'recreation@cityname.gov',
      website: 'https://recreation.cityname.gov',
    },
    {
      id: 794,
      title: 'The Green Earth Foundation',
      slug: 'the-green-earth-foundation',
      status: 'publish',
      type: 'tribe_organizer',
      organizer: 'Green Earth Environmental Foundation',
      email: 'contact@greenearth.org',
      website: 'https://www.greenearth.org',
      phone: '1-800-GO-GREEN',
    },
    {
      id: 795,
      title: 'University Events Office',
      slug: 'university-events-office',
      status: 'draft',
      type: 'tribe_organizer',
      organizer: 'State University Special Events',
      email: 'events@stateuniversity.edu',
      phone: 'ext. 5555',
    },
    {
      id: 796,
      title: 'Jazz Club Productions',
      slug: 'jazz-club-productions',
      status: 'publish',
      type: 'tribe_organizer',
      email: 'bookings@jazzclub.example.com',
      phone: '555-JAZZ-001',
      website: 'https://jazzclub.example.com',
    },
    {
      id: 797,
      title: 'Community Volunteers Network',
      slug: 'community-volunteers-network',
      status: 'pending',
      type: 'tribe_organizer',
      organizer: 'CVN - Community Volunteer Network',
      email: 'volunteer@cvn.org',
    },
    {
      id: 798,
      title: 'Global Business Summit',
      slug: 'global-business-summit',
      status: 'publish',
      type: 'tribe_organizer',
      organizer: 'GBS International',
      email: 'info@globalbusinesssummit.com',
      phone: '+44 20 7946 0958',
      website: 'https://www.globalbusinesssummit.com',
    },
  ],
});

/**
 * Type export
 */
export type Organizer = z.infer<typeof OrganizerSchema>;