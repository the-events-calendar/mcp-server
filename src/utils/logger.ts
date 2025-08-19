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
}

/**
 * Create and configure Winston logger
 */
export function createLogger(config: LoggerConfig = {}): winston.Logger {
  const { level = 'info', logFile } = config;
  
  const transports: winston.transport[] = [];
  
  // If log file is specified, only log to file
  // Otherwise, log to console in JSON format for MCP
  if (logFile) {
    transports.push(
      new winston.transports.File({
        filename: logFile,
        format: logFormat,
        level: level
      })
    );
  } else {
    // Console transport - only if no log file is specified
    transports.push(
      new winston.transports.Console({
        format: jsonConsoleFormat,
        level: level
      })
    );
  }
  
  return winston.createLogger({
    levels,
    transports,
    // Handle exceptions and rejections
    exceptionHandlers: logFile ? [
      new winston.transports.File({ 
        filename: path.join(path.dirname(logFile), 'exceptions.log') 
      })
    ] : undefined,
    rejectionHandlers: logFile ? [
      new winston.transports.File({ 
        filename: path.join(path.dirname(logFile), 'rejections.log') 
      })
    ] : undefined
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