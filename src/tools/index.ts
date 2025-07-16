import { ApiClient } from '../api/client.js';
import { createUpdatePost, createUpdateTool } from './create-update.js';
import { readPost, readTool } from './read.js';
import { deletePost, deleteTool } from './delete.js';
import { searchPosts, searchTool } from './search.js';

export interface ToolHandlers {
  create_update_post: typeof createUpdatePost;
  read_post: typeof readPost;
  delete_post: typeof deletePost;
  search_posts: typeof searchPosts;
}

/**
 * Get all tool handlers
 */
export function getToolHandlers(apiClient: ApiClient): ToolHandlers {
  return {
    create_update_post: (input) => createUpdatePost(input, apiClient),
    read_post: (input) => readPost(input, apiClient),
    delete_post: (input) => deletePost(input, apiClient),
    search_posts: (input) => searchPosts(input, apiClient),
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
    searchTool,
  ];
}