/**
 * Shared tool definitions for WordPress integrations
 * This module extracts the tool schemas into a format that can be used
 * by various WordPress integrations (AI Engine, Angie, etc.)
 */

import { createUpdateTool } from '../../tools/create-update.js';
import { readTool } from '../../tools/read.js';
import { deleteTool } from '../../tools/delete.js';
import { dateTimeTool } from '../../tools/datetime.js';

// The previous zodToJsonSchema function has been removed as we're now
// extracting schemas directly from the tool definitions

/**
 * Tool definition structure that matches MCP protocol
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema format
}

/**
 * Get all tool definitions in a format compatible with WordPress integrations
 */
export function getToolDefinitions(): ToolDefinition[] {
  const tools = [createUpdateTool, readTool, deleteTool, dateTimeTool];
  
  return tools.map(tool => {
    // Use the jsonSchema property if available, otherwise fall back to empty schema
    const inputSchema = tool.jsonSchema || {
      type: 'object',
      properties: {},
      additionalProperties: false,
    };
    
    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
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