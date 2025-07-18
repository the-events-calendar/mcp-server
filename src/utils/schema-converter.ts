import { z } from 'zod';

/**
 * Convert Zod schemas to JSON Schema format for MCP tools
 * This is a simplified converter for our specific use case
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): any {
  // Handle the schemas we use in our tools
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = convertZodType(value as z.ZodTypeAny);
      
      // Check if field is required
      if (!(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }
    
    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false
    };
  }
  
  return convertZodType(schema);
}

function convertZodType(schema: z.ZodTypeAny): any {
  // Get description if available
  const description = (schema as any)._def?.description;
  
  // Handle optional types
  if (schema instanceof z.ZodOptional) {
    const inner = convertZodType((schema._def as any).innerType);
    return description ? { ...inner, description } : inner;
  }
  
  // Handle string types
  if (schema instanceof z.ZodString) {
    const result = { type: 'string' };
    return description ? { ...result, description } : result;
  }
  
  // Handle number types
  if (schema instanceof z.ZodNumber) {
    const result = { type: 'number' };
    return description ? { ...result, description } : result;
  }
  
  // Handle boolean types
  if (schema instanceof z.ZodBoolean) {
    const result = { type: 'boolean' };
    return description ? { ...result, description } : result;
  }
  
  // Handle default values
  if (schema instanceof z.ZodDefault) {
    const inner = convertZodType((schema._def as any).innerType);
    return {
      ...inner,
      default: (schema._def as any).defaultValue()
    };
  }
  
  // Handle enum types
  if (schema instanceof z.ZodEnum) {
    const result = {
      type: 'string',
      enum: (schema._def as any).values
    };
    return description ? { ...result, description } : result;
  }
  
  // Handle array types
  if (schema instanceof z.ZodArray) {
    const result = {
      type: 'array',
      items: convertZodType((schema._def as any).type)
    };
    return description ? { ...result, description } : result;
  }
  
  // Handle union types (like string | array)
  if (schema instanceof z.ZodUnion) {
    const options = (schema._def as any).options.map((opt: z.ZodTypeAny) => convertZodType(opt));
    const result = { oneOf: options };
    return description ? { ...result, description } : result;
  }
  
  // Handle record types (like z.record)
  if (schema instanceof z.ZodRecord) {
    const result = {
      type: 'object',
      additionalProperties: convertZodType((schema._def as any).valueType)
    };
    return description ? { ...result, description } : result;
  }
  
  // Handle object types
  if (schema instanceof z.ZodObject) {
    return zodToJsonSchema(schema);
  }
  
  // Handle any type
  if (schema instanceof z.ZodAny) {
    return {};
  }
  
  // Default fallback
  return { type: 'string' };
}

/**
 * Add descriptions to JSON Schema from our tool definitions
 */
export function enrichJsonSchema(jsonSchema: any, descriptions: Record<string, string>): any {
  if (jsonSchema.properties) {
    for (const [key] of Object.entries(jsonSchema.properties)) {
      if (descriptions[key]) {
        (jsonSchema.properties[key] as any).description = descriptions[key];
      }
    }
  }
  return jsonSchema;
}