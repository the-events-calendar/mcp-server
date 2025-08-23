#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api/client.js';
import { createServer } from './server.js';
import { DebugTransport } from './debug-transport.js';
import { initializeLogger, getLogger } from './utils/logger.js';
import { VERSION } from './version.js';
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
  let consoleLog: boolean = false; // For debugging only
  
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
  // Also check environment variable if not set
  if (!logFile) {
    logFile = process.env.LOG_FILE;
  }
  
  // Parse named command-line arguments
  let hasCliArgs = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    if (arg === '--url' && nextArg) {
      wpUrl = nextArg;
      hasCliArgs = true;
      i++;
    } else if (arg === '--username' && nextArg) {
      wpUsername = nextArg;
      hasCliArgs = true;
      i++;
    } else if (arg === '--password' && nextArg) {
      wpAppPassword = nextArg;
      hasCliArgs = true;
      i++;
    } else if (arg === '--ignore-ssl-errors') {
      wpIgnoreSslErrors = true;
    } else if (arg === '--log-level' && nextArg) {
      logLevel = nextArg;
      i++;
    } else if (arg === '--log-file' && nextArg) {
      // Already parsed above
      i++;
    } else if (arg === '--console-log') {
      // WARNING: This breaks MCP protocol - only use for debugging
      consoleLog = true;
    } else if (arg === '--help' || arg === '-h') {
      // Show help and exit
      if (!logFile) {
        console.log('Usage: npx @the-events-calendar/mcp-server [options]');
        console.log('');
        console.log('Options:');
        console.log('  --url <url>             WordPress site URL');
        console.log('  --username <username>   WordPress username');
        console.log('  --password <password>   WordPress application password');
        console.log('  --ignore-ssl-errors     Ignore SSL certificate errors (for local dev)');
        console.log('  --log-level <level>     Set log level (error, warn, info, http, verbose, debug, silly)');
        console.log('  --log-file <path>       Write logs to file');
        console.log('  --console-log           Enable console logging (WARNING: breaks MCP protocol)');
        console.log('  --help, -h              Show this help message');
        console.log('');
        console.log('Environment variables (as fallback):');
        console.log('  WP_URL                  WordPress site URL');
        console.log('  WP_USERNAME             WordPress username');
        console.log('  WP_APP_PASSWORD         WordPress application password');
        console.log('  WP_IGNORE_SSL_ERRORS    Set to "true" to ignore SSL errors');
        console.log('  WP_ENFORCE_PER_PAGE_LIMIT  Set to "false" to disable 100 item limit');
        console.log('  LOG_LEVEL               Set log level');
        console.log('  LOG_FILE                Write logs to file');
        console.log('');
        console.log('Example:');
        console.log('  npx -y @the-events-calendar/mcp-server --url https://mysite.local --username admin --password "xxxx xxxx xxxx xxxx xxxx xxxx" --log-level debug');
      }
      process.exit(0);
    } else if (arg.startsWith('--')) {
      // Unknown option
      if (!logFile && arg !== '--log-file') {
        console.error(`Unknown option: ${arg}`);
        console.error('Use --help to see available options');
      }
    }
  }
  
  // Fall back to environment variables if not set via CLI
  if (!wpUrl) wpUrl = process.env.WP_URL;
  if (!wpUsername) wpUsername = process.env.WP_USERNAME;
  if (!wpAppPassword) wpAppPassword = process.env.WP_APP_PASSWORD;
  if (!hasCliArgs && process.env.WP_IGNORE_SSL_ERRORS === 'true') {
    wpIgnoreSslErrors = true;
  }
  logLevel = logLevel || process.env.LOG_LEVEL || 'info';
  
  // Initialize logger BEFORE any logging calls
  // By default, no output to preserve MCP protocol integrity
  initializeLogger({ level: logLevel, logFile, consoleLog });
  const logger = getLogger();
  
  const serverName = process.env.MCP_SERVER_NAME || 'tec-mcp-server';
  const serverVersion = VERSION;

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
      console.error('');
      console.error('Option 1: Use named command-line arguments:');
      console.error('  npx -y @the-events-calendar/mcp-server --url <url> --username <user> --password <pass>');
      console.error('');
      console.error('Option 2: Set environment variables:');
      console.error('  WP_URL=<url>');
      console.error('  WP_USERNAME=<username>');
      console.error('  WP_APP_PASSWORD=<password>');
      console.error('');
      console.error('Run with --help for more options');
    } else {
      // Log to file instead
      logger.error('Missing required configuration. --url, --username, and --password (or WP_URL, WP_USERNAME, and WP_APP_PASSWORD env vars) are required.');
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
  // Perform initial health check and fetch site info to enrich instructions
  let siteInfo: any | undefined;
  try {
    siteInfo = await apiClient.getSiteInfo();
  } catch (e) {
    // getSiteInfo already logs details; keep startup resilient
    siteInfo = undefined;
  }

  // Enforce startup health checks: fail fast on REST or auth failures unless explicitly allowed
  const allowWeakStart = process.env.MCP_ALLOW_WEAK_START === 'true';
  const isDebugLogging = (logLevel === 'debug' || logLevel === 'silly' || !!process.env.DEBUG);
  if (!siteInfo) {
    const message = 'Startup health check failed: WordPress REST API not reachable at /wp-json/.';
    if (allowWeakStart) {
      logger.error(`${message} Continuing due to MCP_ALLOW_WEAK_START=true.`);
    } else {
      // Also emit to stderr so MCP clients surface the reason
      console.error(`MCP startup failed: ${message}`);
      if (isDebugLogging) {
        console.error('Details: root /wp-json/ unreachable');
        console.error('Site Info:', JSON.stringify(siteInfo, null, 2));
      }
      logger.error(message);
      if (isDebugLogging) {
        logger.debug('Startup health check details', { siteInfo });
      }
      process.exit(1);
    }
  } else if (siteInfo.authValid === false || siteInfo.authStatusCode === 401 || siteInfo.authStatusCode === 403) {
    const status = siteInfo.authStatusCode || '401/403';
    const failed = Array.isArray(siteInfo.failedChecks) ? siteInfo.failedChecks : [];
    const detail = failed.map((c: any) => `${c.step} ${c.endpoint} -> ${c.statusCode || 'n/a'} ${c.message ? '- ' + c.message : ''}`).join('; ');
    const base = `Startup health check failed: Authentication to WordPress REST API failed (status ${status}). Check username/app password.`;
    const message = isDebugLogging ? `${base} Details: ${detail}` : base;
    // Always fail fast on 401/403 to avoid exposing tools with bad credentials
    console.error(`MCP startup failed: ${message}`);
    if (isDebugLogging) {
      console.error('Site Info:', JSON.stringify(siteInfo, null, 2));
    }
    logger.error(base);
    if (isDebugLogging) {
      logger.debug('Startup health check details', { siteInfo, failedChecks: failed });
    }
    process.exit(1);
  }

  const server = createServer({
    name: serverName,
    version: serverVersion,
    apiClient,
    baseUrl: wpUrl,
    siteInfo,
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