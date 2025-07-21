import { ApiClient } from '../api/client.js';
import { createUpdatePost, createUpdateTool } from './create-update.js';
import { readPost, readTool } from './read.js';
import { deletePost, deleteTool } from './delete.js';
import { getCurrentDateTime, dateTimeTool } from './datetime.js';

export interface ToolHandlers {
  calendar_create_update_entity: typeof createUpdatePost;
  calendar_read_entity: typeof readPost;
  calendar_delete_entity: typeof deletePost;
  current_datetime: typeof getCurrentDateTime;
}

/**
 * Get all tool handlers
 */
export function getToolHandlers(apiClient: ApiClient): ToolHandlers {
  return {
    calendar_create_update_entity: (input) => createUpdatePost(input, apiClient),
    calendar_read_entity: (input) => readPost(input, apiClient),
    calendar_delete_entity: (input) => deletePost(input, apiClient),
    current_datetime: (input) => getCurrentDateTime(input, apiClient),
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