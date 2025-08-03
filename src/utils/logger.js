// Secure logger utility for production-safe logging
// Only logs in development mode, prevents console exposure in production

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Allow logging in development and test environments only
const shouldLog = isDevelopment || isTest;

/**
 * Secure logger that prevents console output in production
 * Maintains same API as console for easy replacement
 */
export const logger = {
  /**
   * Log general information (development only)
   */
  log: (...args) => {
    if (shouldLog) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged for debugging, but sanitized in production)
   */
  error: (...args) => {
    if (shouldLog) {
      console.error(...args);
    } else {
      // In production, log basic error without sensitive details
      console.error('An error occurred. Check logs for details.');
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args) => {
    if (shouldLog) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args) => {
    if (shouldLog) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (shouldLog) {
      console.debug(...args);
    }
  },

  /**
   * Security-focused logging for authentication events
   * Logs minimal info in production
   */
  security: (message, details = {}) => {
    if (shouldLog) {
      console.log(`🔐 Security: ${message}`, details);
    } else {
      // In production, log only basic security events without details
      console.log(`Security event: ${message}`);
    }
  },

  /**
   * Performance logging for monitoring
   */
  performance: (label, duration) => {
    if (shouldLog) {
      console.log(`⚡ Performance: ${label} took ${duration.toFixed(2)}ms`);
    }
  },

  /**
   * Utility to check if logging is enabled
   */
  isEnabled: () => shouldLog,

  /**
   * Environment info
   */
  getEnvironment: () => ({
    isDevelopment,
    isProduction: process.env.NODE_ENV === 'production',
    isTest,
    shouldLog
  })
};

// Default export for easy importing
export default logger;

// Named exports for specific use cases
export const securityLogger = logger.security;
export const performanceLogger = logger.performance;