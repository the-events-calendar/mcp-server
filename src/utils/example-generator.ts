import { z } from 'zod';
import { PostType } from '../types/schemas/index.js';
import { getSchemaForPostType } from './validation.js';

/**
 * Template for generating example values based on field types and names
 */
interface FieldTemplate {
  pattern?: RegExp;
  value: any;
  priority?: number;
}

/**
 * Post type specific configurations
 */
interface PostTypeConfig {
  requiredFields: string[];
  optionalFields: string[];
  updateFields: string[];
  exampleValues?: Record<string, any>;
}

/**
 * Field value templates organized by priority
 */
const FIELD_TEMPLATES: FieldTemplate[] = [
  // Specific field names (highest priority)
  { pattern: /^title$/, value: 'My Event Title', priority: 100 },
  { pattern: /^start_date$/, value: '2024-12-25 15:00:00', priority: 100 },
  { pattern: /^end_date$/, value: '2024-12-25 17:00:00', priority: 100 },
  { pattern: /^description$/, value: 'Event description here', priority: 100 },
  { pattern: /^content$/, value: 'Full content here', priority: 100 },
  { pattern: /^address$/, value: '123 Main St', priority: 100 },
  { pattern: /^city$/, value: 'San Francisco', priority: 100 },
  { pattern: /^country$/, value: 'United States', priority: 100 },
  { pattern: /^state_province$/, value: 'California', priority: 100 },
  { pattern: /^zip$/, value: '94102', priority: 100 },
  { pattern: /^phone$/, value: '555-1234', priority: 100 },
  { pattern: /^email$/, value: 'contact@example.com', priority: 100 },
  { pattern: /^website$/, value: 'https://example.com', priority: 100 },
  { pattern: /^venue$/, value: 'Conference Center', priority: 90 },
  { pattern: /^organizer$/, value: 'John Doe', priority: 90 },
  { pattern: /^price$/, value: '$25.00', priority: 100 },
  { pattern: /^cost$/, value: 'Free', priority: 100 },
  { pattern: /^sku$/, value: 'TIX-001', priority: 100 },
  { pattern: /^timezone$/, value: 'America/New_York', priority: 100 },
  { pattern: /^slug$/, value: 'my-event', priority: 100 },
  { pattern: /^excerpt$/, value: 'A brief summary', priority: 100 },
  { pattern: /^stock$/, value: 100, priority: 100 },
  { pattern: /^capacity$/, value: 200, priority: 100 },
  { pattern: /^all_day$/, value: false, priority: 100 },
  
  // ID fields for relationships
  { pattern: /^venue$/, value: 123, priority: 80 },
  { pattern: /^event$/, value: 456, priority: 80 },
  { pattern: /^organizers$/, value: [10, 11], priority: 80 },
  { pattern: /^categories$/, value: [5, 6], priority: 80 },
  { pattern: /^tags$/, value: [7, 8], priority: 80 },
];

/**
 * Configuration for each post type
 */
const POST_TYPE_CONFIGS: Record<PostType, PostTypeConfig> = {
  event: {
    requiredFields: ['title', 'start_date', 'end_date'],
    optionalFields: ['description', 'venue', 'organizers', 'all_day', 'timezone', 'cost'],
    updateFields: ['title', 'start_date', 'end_date'],
    exampleValues: {
      id: 789,
    }
  },
  venue: {
    requiredFields: ['title', 'address', 'city'],
    optionalFields: ['country', 'state_province', 'zip', 'phone', 'website'],
    updateFields: ['address', 'city'],
    exampleValues: {
      id: 456,
    }
  },
  organizer: {
    requiredFields: ['title', 'email'],
    optionalFields: ['phone', 'website'],
    updateFields: ['email', 'phone'],
    exampleValues: {
      id: 456,
    }
  },
  ticket: {
    requiredFields: ['title', 'event', 'price'],
    optionalFields: ['stock', 'capacity', 'sku'],
    updateFields: ['price', 'stock'],
    exampleValues: {
      id: 456,
    }
  },
};

/**
 * Get example value for a field based on templates
 */
function getExampleValue(field: z.ZodTypeAny, key: string): any {
  // Sort templates by priority
  const sortedTemplates = [...FIELD_TEMPLATES].sort((a, b) => 
    (b.priority || 0) - (a.priority || 0)
  );
  
  // Find matching template
  for (const template of sortedTemplates) {
    if (template.pattern && template.pattern.test(key)) {
      // Check if the value type matches the field type
      if (field instanceof z.ZodNumber && typeof template.value === 'number') {
        return template.value;
      }
      if (field instanceof z.ZodString && typeof template.value === 'string') {
        return template.value;
      }
      if (field instanceof z.ZodBoolean && typeof template.value === 'boolean') {
        return template.value;
      }
      if (field instanceof z.ZodArray && Array.isArray(template.value)) {
        return template.value;
      }
    }
  }
  
  // Handle special Zod types
  if (field instanceof z.ZodOptional) {
    return getExampleValue((field as any)._def.innerType, key);
  }
  
  if (field instanceof z.ZodDefault) {
    return (field as any)._def.defaultValue();
  }
  
  if (field instanceof z.ZodEnum) {
    const values = (field as any)._def.values;
    return values[0] || 'publish';
  }
  
  // Default values by type
  if (field instanceof z.ZodString) return 'example text';
  if (field instanceof z.ZodNumber) return 1;
  if (field instanceof z.ZodBoolean) return true;
  if (field instanceof z.ZodArray) return [];
  
  return null;
}

/**
 * Generate example data from schema using configuration
 */
function generateExampleFromSchema(
  schema: z.ZodObject<any>, 
  postType: PostType,
  fields: string[]
): Record<string, any> {
  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  const example: Record<string, any> = {};
  const config = POST_TYPE_CONFIGS[postType];
  
  for (const field of fields) {
    if (shape[field]) {
      // Check for custom example value first
      if (config.exampleValues?.[field] !== undefined) {
        example[field] = config.exampleValues[field];
      } else {
        const value = getExampleValue(shape[field], field);
        if (value !== null && value !== undefined) {
          example[field] = value;
        }
      }
    }
  }
  
  return example;
}

/**
 * Generate a create example for a post type
 */
export function generateCreateExample(postType: PostType): string {
  const schema = getSchemaForPostType(postType);
  const config = POST_TYPE_CONFIGS[postType];
  
  // Combine required and a subset of optional fields
  const fields = [
    ...config.requiredFields,
    ...config.optionalFields.slice(0, 2)
  ];
  
  const exampleData = generateExampleFromSchema(schema, postType, fields);
  
  return JSON.stringify({
    postType,
    data: exampleData
  }, null, 2);
}

/**
 * Generate an update example for a post type
 */
export function generateUpdateExample(postType: PostType): string {
  const schema = getSchemaForPostType(postType);
  const config = POST_TYPE_CONFIGS[postType];
  
  const exampleData = generateExampleFromSchema(schema, postType, config.updateFields);
  
  return JSON.stringify({
    postType,
    id: config.exampleValues?.id || 456,
    data: exampleData
  }, null, 2);
}

/**
 * Template for tool descriptions
 */
const TOOL_DESCRIPTION_TEMPLATES: Record<string, (postTypes: PostType[]) => string[]> = {
  'tec-calendar-create-update-entities': (postTypes) => [
    '',
    '⚠️ IMPORTANT: Before creating events with dates/times, ALWAYS call the tec-calendar-current-datetime tool first to get the current date, time, and timezone context.',
    '',
    'Date format for events: "YYYY-MM-DD HH:MM:SS" (e.g., "2024-12-25 15:00:00")',
    'Alternative: Use natural language like "tomorrow 2pm", "next monday", "+3 days"',
    '',
    'Workflow example:',
    '1. First: Call tec-calendar-current-datetime tool to get current date/time',
    '2. Then: Create event with calculated dates based on the response',
    '',
    'Examples:',
    '',
    ...postTypes.flatMap(postType => [
      `// Creating ${postType === 'event' ? 'an' : 'a'} ${postType.charAt(0).toUpperCase() + postType.slice(1)}`,
      generateCreateExample(postType),
      ''
    ]),
    '// Updating an existing post',
    generateUpdateExample('event')
  ],
  
  'tec-calendar-read-entities': (_postTypes) => [
    '',
    'Examples:',
    '',
    '// Get a specific event by ID',
    JSON.stringify({ postType: 'event', id: 123 }, null, 2),
    '',
    '// List all venues',
    JSON.stringify({ postType: 'venue' }, null, 2),
    '',
    '// Search for events',
    JSON.stringify({ 
      postType: 'event', 
      search: 'conference',
      per_page: 10 
    }, null, 2),
    '',
    '// Get events with pagination',
    JSON.stringify({ 
      postType: 'event',
      page: 2,
      per_page: 20
    }, null, 2)
  ],
  
  'tec-calendar-delete-entities': (postTypes) => [
    '',
    'Default behavior: Moves posts to trash (can be restored)',
    'Force delete: Permanently deletes posts (cannot be restored)',
    '',
    'Examples:',
    '',
    ...postTypes.slice(0, 2).flatMap(postType => {
      const config = POST_TYPE_CONFIGS[postType];
      const capitalizedType = postType.charAt(0).toUpperCase() + postType.slice(1);
      const article = postType === 'event' ? 'an' : 'a';
      return [
        `// Move ${article} ${capitalizedType} to trash (default)`,
        JSON.stringify({ 
          postType, 
          id: postType === 'event' ? 789 : config.exampleValues?.id || 456
        }, null, 2),
        '',
        `// Permanently delete ${article} ${capitalizedType}`,
        JSON.stringify({ 
          postType, 
          id: postType === 'event' ? 789 : config.exampleValues?.id || 456,
          force: true
        }, null, 2),
        ''
      ];
    }).slice(0, -1) // Remove last empty string
  ]
};

/**
 * Generate tool description using templates
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