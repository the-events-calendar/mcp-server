#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api/client.js';
import { createServer } from './server.js';
import { DebugTransport } from './debug-transport.js';
import { initializeLogger, getLogger } from './utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables quietly (suppress console output)
dotenv.config({ quiet: true } as any);

// Check for SSL ignore early
if (process.env.WP_IGNORE_SSL_ERRORS === 'true' || process.argv.includes('--ignore-ssl-errors')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * Main entry point
 */
async function main() {
  // Initialize variables first
  let wpUrl: string | undefined;
  let wpUsername: string | undefined;
  let wpAppPassword: string | undefined;
  let wpIgnoreSslErrors: boolean = false;
  let logLevel: string = 'info';
  let logFile: string | undefined;
  
  // Parse command-line arguments
  const args = process.argv.slice(2);
  
  // First pass: quickly check for log file to determine output mode
  // This must happen before ANY output
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--log-file' && args[i + 1]) {
      logFile = args[i + 1];
      break;
    }
  }
  // Also check environment variable
  if (!logFile) {
    logFile = process.env.LOG_FILE;
  }
  
  // Parse command-line arguments
  if (args.length >= 3) {
    wpUrl = args[0];
    wpUsername = args[1];
    wpAppPassword = args[2];
    
    // Parse additional options
    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--ignore-ssl-errors') {
        wpIgnoreSslErrors = true;
      } else if (args[i] === '--log-level' && args[i + 1]) {
        logLevel = args[i + 1];
        i++; // Skip next arg
      } else if (args[i] === '--log-file' && args[i + 1]) {
        // Already parsed above
        i++; // Skip next arg
      }
    }
  } else if (args.length > 0 && args.length < 3) {
    // Only show errors to console if no log file is specified
    if (!logFile) {
      console.error('Error: Incomplete command-line arguments.');
      console.error('Usage: npx @the-events-calendar/mcp-server <url> <username> <application-password> [options]');
      console.error('Options:');
      console.error('  --ignore-ssl-errors   Ignore SSL certificate errors');
      console.error('  --log-level <level>   Set log level (error, warn, info, http, verbose, debug, silly)');
      console.error('  --log-file <path>     Write logs to file');
      console.error('Or set environment variables: WP_URL, WP_USERNAME, WP_APP_PASSWORD, WP_IGNORE_SSL_ERRORS, WP_ENFORCE_PER_PAGE_LIMIT, LOG_LEVEL, LOG_FILE');
    }
    process.exit(1);
  } else {
    // Fall back to environment variables
    wpUrl = process.env.WP_URL;
    wpUsername = process.env.WP_USERNAME;
    wpAppPassword = process.env.WP_APP_PASSWORD;
    wpIgnoreSslErrors = process.env.WP_IGNORE_SSL_ERRORS === 'true';
    logLevel = process.env.LOG_LEVEL || logLevel;
    // logFile already set above
  }
  
  // Initialize logger BEFORE any logging calls
  // This ensures that if a log file is specified, nothing goes to console
  initializeLogger({ level: logLevel, logFile });
  const logger = getLogger();
  
  const serverName = process.env.MCP_SERVER_NAME || 'tec-mcp-server';
  const serverVersion = process.env.MCP_SERVER_VERSION || '1.0.0';

  // Enable debug logging if DEBUG env var is set
  const debug = process.env.DEBUG || logLevel === 'debug' || logLevel === 'silly';
  logger.info('Starting MCP server...');
  logger.debug('Process args:', process.argv);
  logger.debug('Parsed args:', args);

  logger.debug('Configuration:', {
    wpUrl: wpUrl ? `${wpUrl.substring(0, 20)}...` : undefined,
    wpUsername,
    hasPassword: !!wpAppPassword,
    ignoreSslErrors: wpIgnoreSslErrors,
    serverName,
    serverVersion,
    logLevel,
    logFile
  });

  if (!wpUrl || !wpUsername || !wpAppPassword) {
    // Only show errors to console if no log file is specified
    if (!logFile) {
      console.error('Missing required configuration.');
      console.error('\nOption 1: Use command-line arguments:');
      console.error('  npx @the-events-calendar/mcp-server <url> <username> <application-password> [--ignore-ssl-errors]');
      console.error('\nOption 2: Set environment variables:');
      console.error('  - WP_URL: WordPress site URL');
      console.error('  - WP_USERNAME: WordPress username');
      console.error('  - WP_APP_PASSWORD: WordPress application password');
      console.error('  - WP_IGNORE_SSL_ERRORS: Set to "true" to ignore SSL errors (optional)');
    } else {
      // Log to file instead
      logger.error('Missing required configuration. WP_URL, WP_USERNAME, and WP_APP_PASSWORD are required.');
    }
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
    logger.warn('SSL certificate verification is disabled. This should only be used for local development.');
  }

  // Create MCP server
  const server = createServer({
    name: serverName,
    version: serverVersion,
    apiClient,
  });

  // Create and connect transport
  // Add a small delay to ensure any module loading output has completed
  logger.silly('Waiting for module loading to complete...');
  await new Promise(resolve => setTimeout(resolve, 100));
  
  logger.debug('Creating stdio transport...');
  const stdioTransport = new StdioServerTransport();
  const transport = debug ? new DebugTransport(stdioTransport) : stdioTransport;
  
  logger.debug('Connecting server to transport...');
  await server.connect(transport);
  
  logger.info(`${serverName} v${serverVersion} started successfully`);
  logger.debug('Server is ready for MCP communication');
}

// Run the server
main().catch((error) => {
  const logger = getLogger();
  logger.error('Fatal error:', error);
  process.exit(1);
});