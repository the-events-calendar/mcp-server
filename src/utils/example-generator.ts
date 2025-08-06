import { z } from 'zod';
import { PostType } from '../types/schemas/index.js';
import { getSchemaForPostType } from './validation.js';

function getExampleValue(field: z.ZodTypeAny, key: string): any {
  const description = (field as any)._def?.description || '';
  
  if (field instanceof z.ZodString) {
    if (key === 'title') return 'My Event Title';
    if (key === 'start_date') return '2024-12-25 15:00:00';
    if (key === 'end_date') return '2024-12-25 17:00:00';
    if (key === 'description' || key === 'content') return 'Event description here';
    if (key === 'address') return '123 Main St';
    if (key === 'city') return 'San Francisco';
    if (key === 'country') return 'United States';
    if (key === 'state_province') return 'California';
    if (key === 'zip') return '94102';
    if (key === 'phone') return '555-1234';
    if (key === 'email') return 'contact@example.com';
    if (key === 'website') return 'https://example.com';
    if (key === 'venue' && description.includes('name')) return 'Conference Center';
    if (key === 'organizer' && description.includes('name')) return 'John Doe';
    if (key === 'price') return '$25.00';
    if (key === 'cost') return 'Free';
    if (key === 'sku') return 'TIX-001';
    if (key === 'timezone') return 'America/New_York';
    if (key === 'slug') return 'my-event';
    if (key === 'excerpt') return 'A brief summary';
    return 'example text';
  }
  
  if (field instanceof z.ZodNumber) {
    if (key === 'venue') return 123;
    if (key === 'event') return 456;
    if (key === 'stock') return 100;
    if (key === 'capacity') return 200;
    return 1;
  }
  
  if (field instanceof z.ZodBoolean) {
    return key === 'all_day' ? false : true;
  }
  
  if (field instanceof z.ZodArray) {
    const innerType = (field as any)._def.type;
    if (innerType instanceof z.ZodNumber) {
      if (key === 'organizers') return [10, 11];
      if (key === 'categories') return [5, 6];
      if (key === 'tags') return [7, 8];
      return [1, 2];
    }
    return [];
  }
  
  if (field instanceof z.ZodEnum) {
    const values = (field as any)._def.values;
    return values[0] || 'publish';
  }
  
  if (field instanceof z.ZodOptional) {
    return getExampleValue((field as any)._def.innerType, key);
  }
  
  if (field instanceof z.ZodDefault) {
    return (field as any)._def.defaultValue();
  }
  
  return null;
}

function generateExampleFromSchema(schema: z.ZodObject<any>, postType: PostType): Record<string, any> {
  const shape = schema.shape;
  const example: Record<string, any> = {};
  
  const requiredFields = getRequiredFieldsForPostType(postType);
  const optionalFields = getOptionalFieldsForPostType(postType);
  
  for (const field of requiredFields) {
    if (shape[field]) {
      const value = getExampleValue(shape[field], field);
      if (value !== null && value !== undefined) {
        example[field] = value;
      }
    }
  }
  
  for (const field of optionalFields.slice(0, 2)) {
    if (shape[field]) {
      const value = getExampleValue(shape[field], field);
      if (value !== null && value !== undefined) {
        example[field] = value;
      }
    }
  }
  
  return example;
}

function getRequiredFieldsForPostType(postType: PostType): string[] {
  switch (postType) {
    case 'event':
      return ['title', 'start_date', 'end_date'];
    case 'venue':
      return ['title', 'address', 'city'];
    case 'organizer':
      return ['title', 'email'];
    case 'ticket':
      return ['title', 'event', 'price'];
    default:
      return ['title'];
  }
}

function getOptionalFieldsForPostType(postType: PostType): string[] {
  switch (postType) {
    case 'event':
      return ['description', 'venue', 'organizers', 'all_day', 'timezone', 'cost'];
    case 'venue':
      return ['country', 'state_province', 'zip', 'phone', 'website'];
    case 'organizer':
      return ['phone', 'website'];
    case 'ticket':
      return ['stock', 'capacity', 'sku'];
    default:
      return ['status', 'content'];
  }
}

export function generateCreateExample(postType: PostType): string {
  const schema = getSchemaForPostType(postType);
  const exampleData = generateExampleFromSchema(schema, postType);
  
  const example = {
    postType,
    data: exampleData
  };
  
  return JSON.stringify(example, null, 2);
}

export function generateUpdateExample(postType: PostType): string {
  const schema = getSchemaForPostType(postType);
  const shape = schema.shape as Record<string, z.ZodTypeAny>;
  const updateFields = getUpdateFieldsForPostType(postType);
  const exampleData: Record<string, any> = {};
  
  for (const field of updateFields) {
    if (shape[field]) {
      const value = getExampleValue(shape[field], field);
      if (value !== null && value !== undefined) {
        exampleData[field] = value;
      }
    }
  }
  
  const example = {
    postType,
    id: postType === 'event' ? 789 : 456,
    data: exampleData
  };
  
  return JSON.stringify(example, null, 2);
}

function getUpdateFieldsForPostType(postType: PostType): string[] {
  switch (postType) {
    case 'event':
      return ['title', 'start_date', 'end_date'];
    case 'venue':
      return ['address', 'city'];
    case 'organizer':
      return ['email', 'phone'];
    case 'ticket':
      return ['price', 'stock'];
    default:
      return ['title', 'status'];
  }
}

export function generateToolDescription(
  toolName: string,
  baseDescription: string,
  postTypes: PostType[]
): string {
  const lines: string[] = [baseDescription];
  
  if (toolName === 'tec-calendar-create-update-entities') {
    lines.push('');
    lines.push('⚠️ IMPORTANT: Before creating events with dates/times, ALWAYS call the tec-calendar-current-datetime tool first to get the current date, time, and timezone context.');
    lines.push('');
    lines.push('Date format for events: "YYYY-MM-DD HH:MM:SS" (e.g., "2024-12-25 15:00:00")');
    lines.push('Alternative: Use natural language like "tomorrow 2pm", "next monday", "+3 days"');
    lines.push('');
    lines.push('Workflow example:');
    lines.push('1. First: Call tec-calendar-current-datetime tool to get current date/time');
    lines.push('2. Then: Create event with calculated dates based on the response');
    lines.push('');
    lines.push('Examples:');
    lines.push('');
    
    for (const postType of postTypes) {
      const label = postType.charAt(0).toUpperCase() + postType.slice(1);
      lines.push(`// Creating ${label === 'Event' ? 'an' : 'a'} ${label}`);
      lines.push(generateCreateExample(postType));
      lines.push('');
    }
    
    lines.push('// Updating an existing post');
    lines.push(generateUpdateExample('event'));
  } else if (toolName === 'tec-calendar-read-entities') {
    lines.push('');
    lines.push('Examples:');
    lines.push('');
    
    lines.push('// Get a specific event by ID');
    lines.push(JSON.stringify({ postType: 'event', id: 123 }, null, 2));
    lines.push('');
    
    lines.push('// List all venues');
    lines.push(JSON.stringify({ postType: 'venue' }, null, 2));
    lines.push('');
    
    lines.push('// Search for events');
    lines.push(JSON.stringify({ 
      postType: 'event', 
      search: 'conference',
      per_page: 10 
    }, null, 2));
    lines.push('');
    
    lines.push('// Get events with pagination');
    lines.push(JSON.stringify({ 
      postType: 'event',
      page: 2,
      per_page: 20
    }, null, 2));
  } else if (toolName === 'tec-calendar-delete-entities') {
    lines.push('');
    lines.push('Examples:');
    lines.push('');
    
    for (const postType of postTypes.slice(0, 2)) {
      const label = postType.charAt(0).toUpperCase() + postType.slice(1);
      lines.push(`// Delete ${label === 'Event' ? 'an' : 'a'} ${label}`);
      lines.push(JSON.stringify({ 
        postType, 
        id: postType === 'event' ? 789 : 456 
      }, null, 2));
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

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