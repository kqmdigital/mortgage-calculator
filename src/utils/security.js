// Security utilities for production deployment
import { clearUserSession } from './auth';

// Rate limiting for login attempts
class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.blockedIPs = new Set();
  }

  // Check if IP/user is rate limited
  checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Clean old attempts outside the window
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Check if blocked
    if (recentAttempts.length >= maxAttempts) {
      this.blockedIPs.add(identifier);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      };
    }
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - recentAttempts.length,
      retryAfter: 0
    };
  }

  // Record a failed attempt
  recordFailedAttempt(identifier) {
    const userAttempts = this.attempts.get(identifier) || [];
    userAttempts.push(Date.now());
    this.attempts.set(identifier, userAttempts);
  }

  // Clear attempts for successful login
  clearAttempts(identifier) {
    this.attempts.delete(identifier);
    this.blockedIPs.delete(identifier);
  }

  // Check if IP is blocked
  isBlocked(identifier) {
    return this.blockedIPs.has(identifier);
  }
}

// Global rate limiter instance
export const authRateLimiter = new RateLimiter();

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS vectors
    .substring(0, 1000); // Limit length
};

// Email sanitization
export const sanitizeEmail = (email) => {
  if (!email) return '';
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, '') // Only allow valid email characters
    .substring(0, 254); // RFC 5321 limit
};

// Password strength checker with detailed feedback
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
    noCommon: !isCommonPassword(password),
    noPersonal: !containsPersonalInfo(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  let strength = 'Very Weak';
  if (score >= 7) strength = 'Very Strong';
  else if (score >= 6) strength = 'Strong';
  else if (score >= 4) strength = 'Moderate';
  else if (score >= 2) strength = 'Weak';

  return {
    score,
    strength,
    checks,
    feedback: generatePasswordFeedback(checks)
  };
};

// Common password check (basic list)
const commonPasswords = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'sunshine', 'princess', 'football'
]);

const isCommonPassword = (password) => {
  return commonPasswords.has(password.toLowerCase());
};

const containsPersonalInfo = (password) => {
  // Basic check - in production, you might check against user's name, email, etc.
  const personalTerms = ['admin', 'user', 'keyquest', 'mortgage'];
  return personalTerms.some(term => 
    password.toLowerCase().includes(term.toLowerCase())
  );
};

const generatePasswordFeedback = (checks) => {
  const feedback = [];
  
  if (!checks.length) feedback.push('Use at least 12 characters');
  if (!checks.uppercase) feedback.push('Add uppercase letters');
  if (!checks.lowercase) feedback.push('Add lowercase letters');
  if (!checks.numbers) feedback.push('Add numbers');
  if (!checks.symbols) feedback.push('Add special characters');
  if (!checks.noCommon) feedback.push('Avoid common passwords');
  if (!checks.noPersonal) feedback.push('Avoid personal information');
  
  return feedback;
};

// Session security
export const validateSession = () => {
  const token = localStorage.getItem('auth_token');
  const lastActivity = sessionStorage.getItem('last_activity');
  
  if (!token || !lastActivity) {
    clearUserSession();
    return false;
  }
  
  // Check for session timeout (1 hour)
  const timeoutDuration = 60 * 60 * 1000;
  if (Date.now() - parseInt(lastActivity) > timeoutDuration) {
    clearUserSession();
    return false;
  }
  
  // Update last activity
  sessionStorage.setItem('last_activity', Date.now().toString());
  return true;
};

// Content Security Policy headers (for production)
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Audit logging
export class AuditLogger {
  static log(action, userId, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId,
      userAgent: navigator.userAgent,
      ip: 'client-side', // In production, get from server
      details,
      sessionId: this.getSessionId()
    };
    
    // In production, send to your logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Log:', logEntry);
    }
    
    // Store recent logs in sessionStorage for debugging
    this.storeLocalLog(logEntry);
  }

  static getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  static storeLocalLog(logEntry) {
    try {
      const logs = JSON.parse(sessionStorage.getItem('audit_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      sessionStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to store audit log:', error);
    }
  }

  static getLogs() {
    try {
      return JSON.parse(sessionStorage.getItem('audit_logs') || '[]');
    } catch (error) {
      return [];
    }
  }
}

// Browser security checks
export const performSecurityChecks = () => {
  const checks = {
    https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    localStorage: typeof(Storage) !== 'undefined',
    cookies: navigator.cookieEnabled,
    javascript: true, // If this runs, JS is enabled
    webCrypto: 'crypto' in window && 'subtle' in window.crypto
  };

  const issues = [];
  
  if (!checks.https && process.env.NODE_ENV === 'production') {
    issues.push('Application should be served over HTTPS in production');
  }
  
  if (!checks.localStorage) {
    issues.push('Browser does not support local storage');
  }
  
  if (!checks.webCrypto) {
    issues.push('Browser does not support Web Crypto API');
  }

  return { checks, issues, secure: issues.length === 0 };
};

// Environment validation
export const validateEnvironment = () => {
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_JWT_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    // Only show error in production or when environment validation is specifically needed
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Missing required environment variables:', missing);
      return false;
    } else {
      // In development, just warn about missing variables
      console.warn('⚠️ Missing environment variables (development):', missing);
      return true; // Allow development to continue
    }
  }

  // Check JWT secret strength
  const jwtSecret = process.env.REACT_APP_JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn('⚠️ JWT secret is too short. Use at least 32 characters.');
  }

  return true;
};

// Data validation utilities
export const validators = {
  email: (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },
  
  name: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 100;
  },
  
  role: (role) => {
    const validRoles = ['super_admin', 'admin', 'editor'];
    return validRoles.includes(role);
  },
  
  uuid: (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
};
