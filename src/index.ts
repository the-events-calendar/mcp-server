#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api/client.js';
import { createServer } from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main entry point
 */
async function main() {
  // Enable debug logging if DEBUG env var is set
  const debug = process.env.DEBUG;
  if (debug) {
    console.error('[DEBUG] Starting MCP server...');
    console.error('[DEBUG] Process args:', process.argv);
  }
  
  // Parse command-line arguments
  const args = process.argv.slice(2);
  if (debug) {
    console.error('[DEBUG] Parsed args:', args);
  }
  
  let wpUrl: string | undefined;
  let wpUsername: string | undefined;
  let wpAppPassword: string | undefined;
  
  // Check if command-line arguments are provided
  if (args.length >= 3) {
    wpUrl = args[0];
    wpUsername = args[1];
    wpAppPassword = args[2];
  } else if (args.length > 0 && args.length < 3) {
    console.error('Error: Incomplete command-line arguments.');
    console.error('Usage: npx @the-events-calendar/mcp-server <url> <username> <application-password>');
    console.error('Or set environment variables: WP_URL, WP_USERNAME, WP_APP_PASSWORD');
    process.exit(1);
  } else {
    // Fall back to environment variables
    wpUrl = process.env.WP_URL;
    wpUsername = process.env.WP_USERNAME;
    wpAppPassword = process.env.WP_APP_PASSWORD;
  }
  
  const serverName = process.env.MCP_SERVER_NAME || 'tec-mcp-server';
  const serverVersion = process.env.MCP_SERVER_VERSION || '1.0.0';

  if (debug) {
    console.error('[DEBUG] Configuration:', {
      wpUrl: wpUrl ? `${wpUrl.substring(0, 20)}...` : undefined,
      wpUsername,
      hasPassword: !!wpAppPassword,
      serverName,
      serverVersion
    });
  }

  if (!wpUrl || !wpUsername || !wpAppPassword) {
    console.error('Missing required configuration.');
    console.error('\nOption 1: Use command-line arguments:');
    console.error('  npx @the-events-calendar/mcp-server <url> <username> <application-password>');
    console.error('\nOption 2: Set environment variables:');
    console.error('  - WP_URL: WordPress site URL');
    console.error('  - WP_USERNAME: WordPress username');
    console.error('  - WP_APP_PASSWORD: WordPress application password');
    process.exit(1);
  }

  // Create API client
  const apiClient = new ApiClient({
    baseUrl: wpUrl,
    username: wpUsername,
    appPassword: wpAppPassword,
  });

  // Create MCP server
  const server = createServer({
    name: serverName,
    version: serverVersion,
    apiClient,
  });

  // Create and connect transport
  // Add a small delay to ensure any module loading output has completed
  if (debug) {
    console.error('[DEBUG] Waiting for module loading to complete...');
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (debug) {
    console.error('[DEBUG] Creating stdio transport...');
  }
  const transport = new StdioServerTransport();
  
  if (debug) {
    console.error('[DEBUG] Connecting server to transport...');
  }
  await server.connect(transport);
  
  console.error(`${serverName} v${serverVersion} started successfully`);
  if (debug) {
    console.error('[DEBUG] Server is ready for MCP communication');
  }
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});