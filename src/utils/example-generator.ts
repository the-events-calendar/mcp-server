import { z } from 'zod';
import { PostType } from '../types/schemas/index.js';
import { SCHEMA_EXAMPLES } from './schema-examples.js';

/**
 * Get examples from schema metadata
 */
function getSchemaExamples(postType: PostType): any[] {
  return SCHEMA_EXAMPLES[postType] || [];
}

/**
 * Clean example for tool usage (remove id and type fields)
 */
function cleanExampleForTool(example: any): any {
  const cleaned = { ...example };
  delete cleaned.id;
  delete cleaned.type;
  delete cleaned.slug; // Usually auto-generated
  delete cleaned.status; // Has default value
  
  // For events, clean up date details if present
  delete cleaned.start_date_details;
  delete cleaned.end_date_details;
  delete cleaned.cost_details;
  delete cleaned.image;
  
  // For tickets, clean availability details if present
  delete cleaned.availability;
  
  return cleaned;
}

/**
 * Select diverse examples from schema
 */
function selectDiverseExamples(examples: any[], count: number): any[] {
  if (examples.length <= count) {
    return examples;
  }
  
  // Try to get a diverse set of examples
  const selected: any[] = [];
  const indices = new Set<number>();
  
  // First, try to get examples with different characteristics
  // Priority 1: Different date formats for events
  const withNaturalDates = examples.findIndex(e => 
    e.start_date && (e.start_date.includes('next') || e.start_date.includes('tomorrow') || e.start_date.includes('+'))
  );
  if (withNaturalDates !== -1 && indices.size < count) {
    selected.push(examples[withNaturalDates]);
    indices.add(withNaturalDates);
  }
  
  // Priority 2: With relationships (venue, organizers)
  const withRelations = examples.findIndex(e => 
    (e.venue || e.organizers || e.event) && !indices.has(examples.indexOf(e))
  );
  if (withRelations !== -1 && indices.size < count) {
    selected.push(examples[withRelations]);
    indices.add(withRelations);
  }
  
  // Priority 3: Different statuses
  const draft = examples.findIndex(e => e.status === 'draft' && !indices.has(examples.indexOf(e)));
  if (draft !== -1 && indices.size < count) {
    selected.push(examples[draft]);
    indices.add(draft);
  }
  
  // Priority 4: With special fields (all_day, cost, etc.)
  const withSpecialFields = examples.findIndex(e => 
    (e.all_day || e.cost || e.website || e.geo_lat) && !indices.has(examples.indexOf(e))
  );
  if (withSpecialFields !== -1 && indices.size < count) {
    selected.push(examples[withSpecialFields]);
    indices.add(withSpecialFields);
  }
  
  // Fill remaining slots with first available examples
  for (let i = 0; i < examples.length && selected.length < count; i++) {
    if (!indices.has(i)) {
      selected.push(examples[i]);
      indices.add(i);
    }
  }
  
  return selected;
}

/**
 * Generate create examples from schema metadata
 */
export function generateCreateExamplesFromSchema(postType: PostType, count: number = 3): string[] {
  const examples = getSchemaExamples(postType);
  const selected = selectDiverseExamples(examples, count);
  
  return selected.map(example => {
    const cleaned = cleanExampleForTool(example);
    return JSON.stringify({
      postType,
      data: cleaned
    }, null, 2);
  });
}

/**
 * Generate update examples from schema metadata
 */
export function generateUpdateExamplesFromSchema(postType: PostType, count: number = 2): string[] {
  const examples = getSchemaExamples(postType);
  const selected = selectDiverseExamples(examples, count);
  
  return selected.map(example => {
    const cleaned = { ...example };
    
    // For updates, only include a subset of fields to show partial updates
    const updateFields: Record<string, string[]> = {
      event: ['title', 'start_date', 'end_date', 'venue', 'cost'],
      venue: ['address', 'city', 'phone', 'website'],
      organizer: ['email', 'phone', 'website'],
      ticket: ['price', 'stock', 'capacity'],
    };
    
    const fieldsToUpdate = updateFields[postType] || ['title'];
    const updateData: any = {};
    
    // Pick 2-3 fields to update
    const fieldCount = Math.min(3, fieldsToUpdate.length);
    for (let i = 0; i < fieldCount; i++) {
      const field = fieldsToUpdate[i];
      if (cleaned[field] !== undefined) {
        updateData[field] = cleaned[field];
      }
    }
    
    return JSON.stringify({
      postType,
      id: example.id || 123,
      data: updateData
    }, null, 2);
  });
}

/**
 * Generate compact read examples for tool description
 */
function generateCompactReadExamples(): string[] {
  const examples: string[] = [];
  
  // 15 diverse examples covering main use cases
  examples.push(
    '### Basic Queries',
    '',
    '**1. Get specific event by ID**',
    '```json',
    '{ "postType": "event", "id": 123 }',
    '```',
    '',
    '**2. List all venues with pagination**',
    '```json',
    '{ "postType": "venue", "per_page": 20, "page": 1 }',
    '```',
    '',
    '**3. Search events by keyword**',
    '```json',
    '{ "postType": "event", "search": "conference" }',
    '```',
    '',
    '**4. Get all organizers sorted by name**',
    '```json',
    '{ "postType": "organizer", "orderby": "title", "order": "asc" }',
    '```',
    '',
    '### Date Filtering',
    '',
    '**5. Get upcoming events** *(after calling tec-calendar-current-datetime)*',
    '```json',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: { start_date: '2024-12-06' }
    }, null, 2),
    '```',
    '',
    '**6. Get events in date range**',
    '```json',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: { 
        start_date: '2024-12-01',
        end_date: '2024-12-31'
      }
    }, null, 2),
    '```',
    '',
    '### Location Filtering',
    '',
    '**7. Find venues by city and state**',
    '```json',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: { city: 'San Francisco', state: 'CA' }
    }, null, 2),
    '```',
    '',
    '**8. Find venues near coordinates**',
    '```json',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: { 
        geo_lat: 37.7749,
        geo_lng: -122.4194,
        radius: 10
      }
    }, null, 2),
    '```',
    '',
    '### Relationship Queries',
    '',
    '**9. Get events at specific venue**',
    '```json',
    '{ "postType": "event", "eventFilters": { "venue": 456 } }',
    '```',
    '',
    '**10. Get tickets for specific event**',
    '```json',
    '{ "postType": "ticket", "ticketFilters": { "event": 123 } }',
    '```',
    '',
    '**11. Get available tickets only**',
    '```json',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: { 
        event: 123,
        available: true
      }
    }, null, 2),
    '```',
    '',
    '### Status & Filtering',
    '',
    '**12. Get only published events**',
    '```json',
    '{ "postType": "event", "status": "publish" }',
    '```',
    '',
    '**13. Get draft and pending venues**',
    '```json',
    '{ "postType": "venue", "status": ["draft", "pending"] }',
    '```',
    '',
    '### Complex Queries',
    '',
    '**14. Search published events at venue with dates**',
    '```json',
    JSON.stringify({ 
      postType: 'event',
      search: 'workshop',
      status: 'publish',
      eventFilters: {
        venue: 456,
        start_date: '2024-12-01'
      },
      per_page: 50
    }, null, 2),
    '```',
    '',
    '**15. Get tickets under $50 sorted by price**',
    '```json',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: { 
        max_price: 50,
        available: true
      },
      orderby: 'price',
      order: 'asc'
    }, null, 2),
    '```',
    '',
    '### Available Filters',
    '',
    '- **eventFilters**: venue, organizer, featured, categories, tags',
    '- **venueFilters**: city, state, country, zip, geo_lat/lng, radius',
    '- **ticketFilters**: event, type, provider, min/max_price',
    '- **organizerFilters**: email, website, phone',
    '- **Common**: status, search, include, exclude, page, per_page, orderby'
  );
  
  return examples;
}

/**
 * Generate full read/search examples (for documentation)
 */
function generateReadExamples(_postTypes: PostType[]): string[] {
  const examples: string[] = [];
  
  // === BASIC RETRIEVAL ===
  examples.push(
    '// === BASIC RETRIEVAL ===',
    '',
    '// Get a specific event by ID',
    JSON.stringify({ postType: 'event', id: 123 }, null, 2),
    '',
    '// Get a specific venue by ID',
    JSON.stringify({ postType: 'venue', id: 456 }, null, 2),
    '',
    '// Get a specific organizer by ID',
    JSON.stringify({ postType: 'organizer', id: 789 }, null, 2),
    '',
    '// Get a specific ticket by ID',
    JSON.stringify({ postType: 'ticket', id: 101 }, null, 2),
    ''
  );
  
  // === LISTING & PAGINATION ===
  examples.push(
    '// === LISTING & PAGINATION ===',
    '',
    '// List all events (default pagination)',
    JSON.stringify({ postType: 'event' }, null, 2),
    '',
    '// List venues with custom pagination',
    JSON.stringify({ postType: 'venue', per_page: 10, page: 1 }, null, 2),
    '',
    '// List organizers sorted by title',
    JSON.stringify({ 
      postType: 'organizer',
      orderby: 'title',
      order: 'asc',
      per_page: 25
    }, null, 2),
    '',
    '// List tickets with maximum results',
    JSON.stringify({ 
      postType: 'ticket',
      per_page: 100
    }, null, 2),
    ''
  );
  
  // === SEARCH QUERIES ===
  examples.push(
    '// === SEARCH QUERIES ===',
    '',
    '// Search events by keyword',
    JSON.stringify({ 
      postType: 'event', 
      search: 'conference',
      per_page: 20 
    }, null, 2),
    '',
    '// Search venues for "ballroom"',
    JSON.stringify({ 
      postType: 'venue',
      search: 'ballroom'
    }, null, 2),
    '',
    '// Search organizers by name',
    JSON.stringify({ 
      postType: 'organizer',
      search: 'arts council'
    }, null, 2),
    '',
    '// Search tickets for "VIP"',
    JSON.stringify({ 
      postType: 'ticket',
      search: 'VIP'
    }, null, 2),
    ''
  );
  
  // === DATE FILTERING (EVENTS) ===
  examples.push(
    '// === DATE FILTERING (EVENTS) ===',
    '// Note: Always call tec-calendar-current-datetime first for date calculations',
    '',
    '// Get events in December 2024',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        start_date: '2024-12-01',
        end_date: '2024-12-31'
      }
    }, null, 2),
    '',
    '// Get events starting after a specific date',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        start_date: '2024-12-15'
      }
    }, null, 2),
    '',
    '// Get events ending before a date',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        end_date: '2024-12-25'
      }
    }, null, 2),
    '',
    '// Get today\'s events (use calculated date)',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        start_date: '2024-12-06',
        end_date: '2024-12-06'
      }
    }, null, 2),
    ''
  );
  
  // === LOCATION FILTERING (VENUES) ===
  examples.push(
    '// === LOCATION FILTERING (VENUES) ===',
    '',
    '// Find venues in a specific city',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        city: 'San Francisco'
      }
    }, null, 2),
    '',
    '// Find venues by city and state',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        city: 'Austin',
        state: 'TX'
      }
    }, null, 2),
    '',
    '// Find venues in a country',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        country: 'United Kingdom'
      }
    }, null, 2),
    '',
    '// Find venues by postal code',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        zip: '94102'
      }
    }, null, 2),
    '',
    '// Find venues near coordinates (within radius)',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        geo_lat: 37.7749,
        geo_lng: -122.4194,
        radius: 10
      }
    }, null, 2),
    ''
  );
  
  // === EVENT-SPECIFIC FILTERS ===
  examples.push(
    '// === EVENT-SPECIFIC FILTERS ===',
    '',
    '// Get events at a specific venue',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        venue: 456
      }
    }, null, 2),
    '',
    '// Get events by a specific organizer',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        organizer: 789
      }
    }, null, 2),
    '',
    '// Get featured events only',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        featured: true
      }
    }, null, 2),
    '',
    '// Get events in specific categories',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        categories: [10, 11, 12]
      }
    }, null, 2),
    '',
    '// Get events with specific tags',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        tags: [20, 21]
      }
    }, null, 2),
    ''
  );
  
  // === TICKET FILTERS ===
  examples.push(
    '// === TICKET FILTERS ===',
    '',
    '// Get all tickets for an event',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        event: 123
      }
    }, null, 2),
    '',
    '// Get only available tickets for an event',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        event: 123,
        available: true
      }
    }, null, 2),
    '',
    '// Get RSVP tickets only',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        type: 'rsvp'
      }
    }, null, 2),
    '',
    '// Get paid tickets only',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        type: 'paid'
      }
    }, null, 2),
    '',
    '// Get tickets by provider',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        provider: 'WooCommerce'
      }
    }, null, 2),
    '',
    '// Get tickets in price range',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        min_price: 25,
        max_price: 100
      }
    }, null, 2),
    ''
  );
  
  // === ORGANIZER FILTERS ===
  examples.push(
    '// === ORGANIZER FILTERS ===',
    '',
    '// Find organizers by email domain',
    JSON.stringify({ 
      postType: 'organizer',
      organizerFilters: {
        email: '@example.org'
      }
    }, null, 2),
    '',
    '// Find organizers with websites',
    JSON.stringify({ 
      postType: 'organizer',
      organizerFilters: {
        website: 'https://'
      }
    }, null, 2),
    '',
    '// Find organizers by phone area code',
    JSON.stringify({ 
      postType: 'organizer',
      organizerFilters: {
        phone: '(555)'
      }
    }, null, 2),
    ''
  );
  
  // === STATUS FILTERING ===
  examples.push(
    '// === STATUS FILTERING ===',
    '',
    '// Get only published events',
    JSON.stringify({ 
      postType: 'event',
      status: 'publish'
    }, null, 2),
    '',
    '// Get draft venues',
    JSON.stringify({ 
      postType: 'venue',
      status: 'draft'
    }, null, 2),
    '',
    '// Get pending organizers',
    JSON.stringify({ 
      postType: 'organizer',
      status: 'pending'
    }, null, 2),
    '',
    '// Get private tickets',
    JSON.stringify({ 
      postType: 'ticket',
      status: 'private'
    }, null, 2),
    '',
    '// Get multiple statuses',
    JSON.stringify({ 
      postType: 'event',
      status: ['publish', 'draft']
    }, null, 2),
    ''
  );
  
  // === INCLUSION/EXCLUSION ===
  examples.push(
    '// === INCLUSION/EXCLUSION ===',
    '',
    '// Get only specific events by IDs',
    JSON.stringify({ 
      postType: 'event',
      include: [123, 124, 125]
    }, null, 2),
    '',
    '// Exclude specific venues from results',
    JSON.stringify({ 
      postType: 'venue',
      exclude: [456, 457]
    }, null, 2),
    ''
  );
  
  // === COMPLEX QUERIES ===
  examples.push(
    '// === COMPLEX QUERIES ===',
    '',
    '// Search upcoming published events at a venue',
    JSON.stringify({ 
      postType: 'event',
      search: 'workshop',
      status: 'publish',
      eventFilters: {
        venue: 456,
        start_date: '2024-12-06'
      },
      per_page: 50
    }, null, 2),
    '',
    '// Find draft events by organizer with date range',
    JSON.stringify({ 
      postType: 'event',
      status: 'draft',
      eventFilters: {
        organizer: 789,
        start_date: '2024-12-01',
        end_date: '2024-12-31'
      },
      orderby: 'date',
      order: 'asc'
    }, null, 2),
    '',
    '// Search venues in multiple cities with pagination',
    JSON.stringify({ 
      postType: 'venue',
      search: 'conference',
      venueFilters: {
        state: 'CA'
      },
      page: 2,
      per_page: 20,
      orderby: 'title',
      order: 'asc'
    }, null, 2),
    '',
    '// Get available tickets under $50 for an event',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        event: 123,
        available: true,
        max_price: 50
      },
      orderby: 'price',
      order: 'asc'
    }, null, 2),
    ''
  );
  
  return examples;
}

/**
 * Template for tool descriptions with rich examples
 */
const TOOL_DESCRIPTION_TEMPLATES: Record<string, (postTypes: PostType[]) => string[]> = {
  'tec-calendar-create-update-entities': (postTypes) => {
    const lines: string[] = [
      '',
      '**IMPORTANT**: Before creating events with dates/times, ALWAYS call the `tec-calendar-current-datetime` tool first to get the current date, time, and timezone context.',
      '',
      '### Date Formats Supported',
      '',
      '- **ISO 8601**: `"2024-12-25T15:00:00"`',
      '- **Date and time**: `"2024-12-25 15:00:00"`',  
      '- **Natural language**: `"tomorrow 2pm"`, `"next monday"`, `"first thursday of next month"`',
      '- **Relative**: `"+3 days"`, `"+2 hours"`, `"3 days 1 hour"`',
      '- **Specific dates**: `"December 15, 2024 7:00 PM"`',
      '',
      '### Workflow for Events with Dates',
      '',
      '1. Call `tec-calendar-current-datetime` tool',
      '2. Calculate appropriate dates based on response',
      '3. Create/update event with calculated dates',
      '',
      '### Create Examples',
      ''
    ];
    
    // Add create examples for each post type
    for (const postType of postTypes) {
      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
      const examples = generateCreateExamplesFromSchema(postType, postType === 'event' ? 4 : 2);
      
      lines.push(`#### ${typeLabel} Creation`);
      lines.push('');
      examples.forEach((example, index) => {
        lines.push(`**Example ${index + 1}: ${getExampleDescription(postType, index)}**`);
        lines.push('```json');
        lines.push(example);
        lines.push('```');
        lines.push('');
      });
    }
    
    // Add update examples
    lines.push('### Update Examples');
    lines.push('');
    
    for (const postType of ['event', 'venue'] as PostType[]) {
      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
      const examples = generateUpdateExamplesFromSchema(postType, 2);
      
      lines.push(`#### Updating ${typeLabel}s`);
      lines.push('');
      examples.forEach((example, index) => {
        lines.push(`**Partial update example ${index + 1}**`);
        lines.push('```json');
        lines.push(example);
        lines.push('```');
        lines.push('');
      });
    }
    
    return lines;
  },
  
  'tec-calendar-read-entities': (_postTypes) => [
    '',
    '### Query Capabilities',
    '',
    '- Get single post by ID',
    '- List all posts with pagination',
    '- Search posts by keyword',
    '- Filter by post-specific criteria',
    '- Combine multiple filters',
    '',
    '## Examples',
    '',
    ...generateCompactReadExamples()
  ],
  
  'tec-calendar-delete-entities': (postTypes) => {
    const lines: string[] = [
      '',
      '### Delete Behaviors',
      '',
      '- **Default** (`force=false`): Moves to trash (recoverable)',
      '- **Force delete** (`force=true`): Permanent deletion (not recoverable)',
      '',
      '### Best Practices',
      '',
      '- Always use default trash unless permanent deletion is required',
      '- Consider checking post details before deletion',
      '- For events, verify dates with `tec-calendar-current-datetime` first',
      '',
      '### Examples',
      ''
    ];
    
    // Get real IDs from schema examples
    const exampleIds: Record<PostType, number[]> = {
      event: [123, 124, 125],
      venue: [456, 457, 458],
      organizer: [789, 790, 791],
      ticket: [101, 102, 103]
    };
    
    for (const postType of postTypes.slice(0, 3)) {
      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
      const ids = exampleIds[postType] || [100, 101];
      
      lines.push(`#### ${typeLabel} Deletion`);
      lines.push('');
      lines.push('**Move to trash (default, recoverable)**');
      lines.push('```json');
      lines.push(JSON.stringify({ 
        postType, 
        id: ids[0]
      }, null, 2));
      lines.push('```');
      lines.push('');
      lines.push('**Permanent deletion (not recoverable)**');
      lines.push('```json');
      lines.push(JSON.stringify({ 
        postType, 
        id: ids[1],
        force: true
      }, null, 2));
      lines.push('```');
      lines.push('');
    }
    
    return lines;
  }
};

/**
 * Get descriptive label for example based on index and type
 */
function getExampleDescription(postType: PostType, index: number): string {
  const descriptions: Record<PostType, string[]> = {
    event: [
      'Standard event with ISO dates',
      'Event with natural language dates',
      'All-day event',
      'Event with venue and organizers',
      'Draft event with cost',
      'Multi-day event'
    ],
    venue: [
      'Complete venue with address',
      'Virtual/online venue',
      'International venue',
      'Minimal venue info'
    ],
    organizer: [
      'Organization with full contact',
      'Individual organizer',
      'Organization without phone',
      'Draft organizer'
    ],
    ticket: [
      'Paid general admission',
      'VIP ticket with limited availability',
      'Free RSVP',
      'Early bird special'
    ]
  };
  
  return descriptions[postType]?.[index] || `${postType} example`;
}

/**
 * Generate tool description using templates and schema examples
 */
export function generateToolDescription(
  toolName: string,
  baseDescription: string,
  postTypes: PostType[]
): string {
  const template = TOOL_DESCRIPTION_TEMPLATES[toolName];
  
  if (!template) {
    return baseDescription;
  }
  
  const lines = [baseDescription, ...template(postTypes)];
  return lines.join('\n');
}

/**
 * Generate field descriptions from schema
 */
export function generateFieldDescription(schema: z.ZodObject<any>): string {
  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  const fields: string[] = [];
  
  for (const [key, field] of Object.entries(shape)) {
    const description = (field as any)._def?.description;
    if (description) {
      fields.push(`- ${key}: ${description}`);
    }
  }
  
  return fields.join('\n');
}

/**
 * Generate full documentation with all examples (for external docs)
 */
export function generateFullReadDocumentation(): string {
  return [
    'Read, list, or search calendar posts.',
    '',
    '⚠️ IMPORTANT: When filtering events by date, ALWAYS call the tec-calendar-current-datetime tool FIRST.',
    '',
    ...generateReadExamples(['event', 'venue', 'organizer', 'ticket'] as PostType[])
  ].join('\n');
}