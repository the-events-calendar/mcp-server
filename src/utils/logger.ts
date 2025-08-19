import winston from 'winston';
import path from 'path';

// Winston log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Custom colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// JSON format for MCP console output
const jsonConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

interface LoggerConfig {
  level?: string;
  logFile?: string;
  consoleLog?: boolean; // WARNING: Breaks MCP protocol - for debugging only
}

/**
 * Create and configure Winston logger
 */
export function createLogger(config: LoggerConfig = {}): winston.Logger {
  const { level = 'info', logFile, consoleLog = false } = config;
  
  const transports: winston.transport[] = [];
  
  // IMPORTANT: For MCP protocol compliance, we should NOT log to console by default
  // Only log when explicitly specified via log file or console flag
  if (logFile) {
    transports.push(
      new winston.transports.File({
        filename: logFile,
        format: logFormat,
        level: level
      })
    );
  }
  
  // WARNING: Console logging breaks MCP protocol - only for debugging
  if (consoleLog && !logFile) {
    transports.push(
      new winston.transports.Console({
        format: jsonConsoleFormat,
        level: level
      })
    );
  }
  
  // If no transports configured, add a silent transport to prevent errors
  if (transports.length === 0) {
    transports.push(
      new winston.transports.Console({
        format: jsonConsoleFormat,
        level: 'none', // Effectively silences all output
        silent: true
      })
    );
  }
  
  return winston.createLogger({
    levels,
    transports,
    // Handle exceptions and rejections only when logging to file
    exceptionHandlers: logFile ? [
      new winston.transports.File({ 
        filename: path.join(path.dirname(logFile), 'exceptions.log') 
      })
    ] : undefined,
    rejectionHandlers: logFile ? [
      new winston.transports.File({ 
        filename: path.join(path.dirname(logFile), 'rejections.log') 
      })
    ] : undefined,
    // Prevent winston from exiting on handled exceptions
    exitOnError: false
  });
}

// Create default logger instance
let logger: winston.Logger;

/**
 * Initialize the global logger
 */
export function initializeLogger(config: LoggerConfig = {}): void {
  logger = createLogger(config);
}

/**
 * Get the global logger instance
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    // Create default logger if not initialized
    logger = createLogger();
  }
  return logger;
}

// Export a default logger for immediate use
export default getLogger();