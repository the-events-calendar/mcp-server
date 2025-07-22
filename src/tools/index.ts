import { ApiClient } from '../api/client.js';
import { createUpdatePost, createUpdateTool } from './create-update.js';
import { readPost, readTool } from './read.js';
import { deletePost, deleteTool } from './delete.js';
import { getCurrentDateTime, dateTimeTool } from './datetime.js';

export interface ToolHandlers {
  'tec-calendar-create-update-entities': typeof createUpdatePost;
  'tec-calendar-read-entities': typeof readPost;
  'tec-calendar-delete-entities': typeof deletePost;
  'tec-calendar-current-datetime': typeof getCurrentDateTime;
}

/**
 * Get all tool handlers
 */
export function getToolHandlers(apiClient: ApiClient): ToolHandlers {
  return {
    'tec-calendar-create-update-entities': (input) => createUpdatePost(input, apiClient),
    'tec-calendar-read-entities': (input) => readPost(input, apiClient),
    'tec-calendar-delete-entities': (input) => deletePost(input, apiClient),
    'tec-calendar-current-datetime': (input) => getCurrentDateTime(input, apiClient),
  };
}

/**
 * Get all tool definitions
 */
export function getToolDefinitions() {
  return [
    dateTimeTool,
    createUpdateTool,
    readTool,
    deleteTool,
  ];
}