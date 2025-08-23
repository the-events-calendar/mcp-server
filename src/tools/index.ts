import { ApiClient } from '../api/client.js';
import { createUpdatePost, createUpdateTool } from './create-update.js';
import { readPost, readTool } from './read.js';
import { deletePost, deleteTool } from './delete.js';

export interface ToolHandlers {
  'tec-calendar-create-update-entities': typeof createUpdatePost;
  'tec-calendar-read-entities': typeof readPost;
  'tec-calendar-delete-entities': typeof deletePost;
}

/**
 * Get all tool handlers
 */
export function getToolHandlers(apiClient: ApiClient): ToolHandlers {
  return {
    'tec-calendar-create-update-entities': (input) => createUpdatePost(input, apiClient),
    'tec-calendar-read-entities': (input) => readPost(input, apiClient),
    'tec-calendar-delete-entities': (input) => deletePost(input, apiClient),
  };
}

/**
 * Get all tool definitions
 */
export function getToolDefinitions() {
  return [
    createUpdateTool,
    readTool,
    deleteTool,
  ];
}