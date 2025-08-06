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
 * Generate read/search examples
 */
function generateReadExamples(_postTypes: PostType[]): string[] {
  const examples: string[] = [];
  
  // Single item retrieval
  examples.push(
    '// Get a specific event by ID',
    JSON.stringify({ postType: 'event', id: 123 }, null, 2),
    ''
  );
  
  // List all with pagination
  examples.push(
    '// List all venues with pagination',
    JSON.stringify({ postType: 'venue', per_page: 10, page: 1 }, null, 2),
    ''
  );
  
  // Search with query
  examples.push(
    '// Search for events containing "conference"',
    JSON.stringify({ 
      postType: 'event', 
      search: 'conference',
      per_page: 20 
    }, null, 2),
    ''
  );
  
  // Filter by date (events)
  examples.push(
    '// Get upcoming events (after calling tec-calendar-current-datetime)',
    JSON.stringify({ 
      postType: 'event',
      eventFilters: {
        start_date: '2024-12-01',
        end_date: '2024-12-31'
      }
    }, null, 2),
    ''
  );
  
  // Filter by location (venues)
  examples.push(
    '// Find venues in San Francisco',
    JSON.stringify({ 
      postType: 'venue',
      venueFilters: {
        city: 'San Francisco',
        state: 'CA'
      }
    }, null, 2),
    ''
  );
  
  // Filter by event (tickets)
  examples.push(
    '// Get all tickets for a specific event',
    JSON.stringify({ 
      postType: 'ticket',
      ticketFilters: {
        event: 456,
        available: true
      }
    }, null, 2),
    ''
  );
  
  // Search organizers
  examples.push(
    '// Search for organizers by name',
    JSON.stringify({ 
      postType: 'organizer',
      search: 'arts council'
    }, null, 2),
    ''
  );
  
  // Complex filtering
  examples.push(
    '// Get draft events with specific organizer',
    JSON.stringify({ 
      postType: 'event',
      status: 'draft',
      eventFilters: {
        organizer: 789
      }
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
      '⚠️ IMPORTANT: Before creating events with dates/times, ALWAYS call the tec-calendar-current-datetime tool first to get the current date, time, and timezone context.',
      '',
      '📅 Date Formats Supported:',
      '• ISO 8601: "2024-12-25T15:00:00"',
      '• Date and time: "2024-12-25 15:00:00"',  
      '• Natural language: "tomorrow 2pm", "next monday", "first thursday of next month"',
      '• Relative: "+3 days", "+2 hours", "3 days 1 hour"',
      '• Specific dates: "December 15, 2024 7:00 PM"',
      '',
      '🔄 Workflow for Events with Dates:',
      '1. Call tec-calendar-current-datetime tool',
      '2. Calculate appropriate dates based on response',
      '3. Create/update event with calculated dates',
      '',
      '📝 CREATE Examples:',
      ''
    ];
    
    // Add create examples for each post type
    for (const postType of postTypes) {
      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
      const examples = generateCreateExamplesFromSchema(postType, postType === 'event' ? 4 : 2);
      
      lines.push(`// === ${typeLabel} Creation Examples ===`);
      examples.forEach((example, index) => {
        if (index > 0) lines.push('');
        lines.push(`// Example ${index + 1}: ${getExampleDescription(postType, index)}`);
        lines.push(example);
      });
      lines.push('');
    }
    
    // Add update examples
    lines.push('✏️ UPDATE Examples:');
    lines.push('');
    
    for (const postType of ['event', 'venue'] as PostType[]) {
      const typeLabel = postType.charAt(0).toUpperCase() + postType.slice(1);
      const examples = generateUpdateExamplesFromSchema(postType, 2);
      
      lines.push(`// === Updating ${typeLabel}s ===`);
      examples.forEach((example, index) => {
        if (index > 0) lines.push('');
        lines.push(`// Partial update example ${index + 1}`);
        lines.push(example);
      });
      lines.push('');
    }
    
    return lines;
  },
  
  'tec-calendar-read-entities': (_postTypes) => [
    '',
    '🔍 Query Capabilities:',
    '• Get single post by ID',
    '• List all posts with pagination',
    '• Search posts by keyword',
    '• Filter by post-specific criteria',
    '• Combine multiple filters',
    '',
    'Examples:',
    '',
    ...generateReadExamples(['event', 'venue', 'organizer', 'ticket'] as PostType[])
  ],
  
  'tec-calendar-delete-entities': (postTypes) => {
    const lines: string[] = [
      '',
      '🗑️ Delete Behaviors:',
      '• Default (force=false): Moves to trash (recoverable)',
      '• Force delete (force=true): Permanent deletion (not recoverable)',
      '',
      '⚠️ Best Practices:',
      '• Always use default trash unless permanent deletion is required',
      '• Consider checking post details before deletion',
      '• For events, verify dates with tec-calendar-current-datetime first',
      '',
      'Examples:',
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
      
      lines.push(`// === ${typeLabel} Deletion ===`);
      lines.push('');
      lines.push(`// Move to trash (default, recoverable)`);
      lines.push(JSON.stringify({ 
        postType, 
        id: ids[0]
      }, null, 2));
      lines.push('');
      lines.push(`// Permanent deletion (not recoverable)`);
      lines.push(JSON.stringify({ 
        postType, 
        id: ids[1],
        force: true
      }, null, 2));
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