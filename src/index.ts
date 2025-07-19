#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api/client.js';
import { createServer } from './server.js';
import { DebugTransport } from './debug-transport.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for SSL ignore early
if (process.env.WP_IGNORE_SSL_ERRORS === 'true' || process.argv.includes('--ignore-ssl-errors')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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
  let wpIgnoreSslErrors: boolean = false;
  
  // Check if command-line arguments are provided
  if (args.length >= 3) {
    wpUrl = args[0];
    wpUsername = args[1];
    wpAppPassword = args[2];
    // Optional 4th argument for ignoring SSL errors
    if (args[3] === '--ignore-ssl-errors') {
      wpIgnoreSslErrors = true;
    }
  } else if (args.length > 0 && args.length < 3) {
    console.error('Error: Incomplete command-line arguments.');
    console.error('Usage: npx @the-events-calendar/mcp-server <url> <username> <application-password> [--ignore-ssl-errors]');
    console.error('Or set environment variables: WP_URL, WP_USERNAME, WP_APP_PASSWORD, WP_IGNORE_SSL_ERRORS, WP_ENFORCE_PER_PAGE_LIMIT');
    process.exit(1);
  } else {
    // Fall back to environment variables
    wpUrl = process.env.WP_URL;
    wpUsername = process.env.WP_USERNAME;
    wpAppPassword = process.env.WP_APP_PASSWORD;
    wpIgnoreSslErrors = process.env.WP_IGNORE_SSL_ERRORS === 'true';
  }
  
  const serverName = process.env.MCP_SERVER_NAME || 'tec-mcp-server';
  const serverVersion = process.env.MCP_SERVER_VERSION || '1.0.0';

  if (debug) {
    console.error('[DEBUG] Configuration:', {
      wpUrl: wpUrl ? `${wpUrl.substring(0, 20)}...` : undefined,
      wpUsername,
      hasPassword: !!wpAppPassword,
      ignoreSslErrors: wpIgnoreSslErrors,
      serverName,
      serverVersion
    });
  }

  if (!wpUrl || !wpUsername || !wpAppPassword) {
    console.error('Missing required configuration.');
    console.error('\nOption 1: Use command-line arguments:');
    console.error('  npx @the-events-calendar/mcp-server <url> <username> <application-password> [--ignore-ssl-errors]');
    console.error('\nOption 2: Set environment variables:');
    console.error('  - WP_URL: WordPress site URL');
    console.error('  - WP_USERNAME: WordPress username');
    console.error('  - WP_APP_PASSWORD: WordPress application password');
    console.error('  - WP_IGNORE_SSL_ERRORS: Set to "true" to ignore SSL errors (optional)');
    process.exit(1);
  }

  // Create API client
  const apiClient = new ApiClient({
    baseUrl: wpUrl,
    username: wpUsername,
    appPassword: wpAppPassword,
    ignoreSslErrors: wpIgnoreSslErrors,
    enforcePerPageLimit: process.env.WP_ENFORCE_PER_PAGE_LIMIT !== 'false', // Defaults to true
  });
  
  if (wpIgnoreSslErrors) {
    console.error('WARNING: SSL certificate verification is disabled. This should only be used for local development.');
  }

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
  const stdioTransport = new StdioServerTransport();
  const transport = debug ? new DebugTransport(stdioTransport) : stdioTransport;
  
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