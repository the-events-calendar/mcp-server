/**
 * Shared tool definitions for WordPress integrations
 * This module extracts the tool schemas into a format that can be used
 * by various WordPress integrations (AI Engine, Angie, etc.)
 */

import { createUpdateTool } from '../../tools/create-update.js';
import { readTool } from '../../tools/read.js';
import { deleteTool } from '../../tools/delete.js';

// The previous zodToJsonSchema function has been removed as we're now
// extracting schemas directly from the tool definitions

/**
 * Tool definition structure that matches MCP protocol
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema format
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

/**
 * Get all tool definitions in a format compatible with WordPress integrations
 */
export function getToolDefinitions(): ToolDefinition[] {
  const tools = [createUpdateTool, readTool, deleteTool];
  
  return tools.map(tool => {
    // Use the jsonSchema property if available, otherwise fall back to empty schema
    const inputSchema = tool.jsonSchema || {
      type: 'object',
      properties: {},
      additionalProperties: false,
    };
    
    // Define annotations based on tool name
    let annotations: ToolDefinition['annotations'] = {};
    
    switch (tool.name) {
      case 'tec-calendar-create-update-entities':
        annotations = {
          title: 'Create or Update Calendar Entities',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        };
        break;
      case 'tec-calendar-read-entities':
        annotations = {
          title: 'Read Calendar Entities',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        };
        break;
      case 'tec-calendar-delete-entities':
        annotations = {
          title: 'Delete Calendar Entities',
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false
        };
        break;
    }
    
    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
      annotations,
    };
  });
}

/**
 * Export tool definitions as a JSON string for embedding in PHP
 */
export function getToolDefinitionsAsJson(): string {
  return JSON.stringify(getToolDefinitions(), null, 2);
}

/**
 * Export tool definitions as a PHP-compatible string
 * This escapes the JSON properly for inclusion in PHP files
 */
export function getToolDefinitionsForPhp(): string {
  const json = getToolDefinitionsAsJson();
  // Escape single quotes for PHP string
  return json.replace(/'/g, "\\'");
}