// Browser-compatible authentication utilities
// Note: Password hashing and JWT generation should be done server-side in production

// Simple secret for token signing (should be environment variable in production)
const TOKEN_SECRET = process.env.REACT_APP_TOKEN_SECRET || 'keyquest-mortgage-calculator-2025-default-secret';

// Generate simple hash for token signing
const generateSimpleHash = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data + TOKEN_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Enhanced session token generation with simple signing
export const generateSessionToken = async (userData) => {
  const payload = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours inactivity timeout
    iat: Math.floor(Date.now() / 1000) // issued at time
  };

  // Base64 encode the payload
  const encodedPayload = btoa(JSON.stringify(payload));

  // Generate signature
  const signature = await generateSimpleHash(encodedPayload);

  // Return token with payload and signature
  return `${encodedPayload}.${signature}`;
};

export const verifySessionToken = async (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    // Split token into payload and signature
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null; // Invalid token format
    }

    const [encodedPayload, providedSignature] = parts;
    
    // Verify signature
    const expectedSignature = await generateSimpleHash(encodedPayload);
    if (providedSignature !== expectedSignature) {
      return null; // Invalid signature
    }

    // Parse payload
    const payload = JSON.parse(atob(encodedPayload));

    // Check token expiration (24 hours from creation)
    if (Date.now() > payload.expires) {
      return null;
    }

    // Check inactivity timeout
    const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');
    if (lastActivity) {
      const inactivityPeriod = Date.now() - lastActivity;
      const maxInactivity = payload.inactivityTimeout || (2 * 60 * 60 * 1000); // Default 2 hours

      if (inactivityPeriod > maxInactivity) {
        return null; // Session expired due to inactivity
      }
    }

    // Additional validation
    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

// Password validation (client-side)
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Session management
export const setUserSession = (token, userData) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_data', JSON.stringify(userData));
  sessionStorage.setItem('last_activity', Date.now().toString());
};

export const getUserSession = async () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  
  if (!token || !userData) return null;
  
  try {
    const user = JSON.parse(userData);
    const tokenData = await verifySessionToken(token);
    
    if (!tokenData) {
      clearUserSession();
      return null;
    }
    
    return { token, user, tokenData };
  } catch (error) {
    clearUserSession();
    return null;
  }
};

export const clearUserSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  sessionStorage.removeItem('last_activity');
};

// Check if session has timed out due to inactivity
export const checkSessionTimeout = () => {
  const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');

  if (!lastActivity) {
    // No activity recorded, set current time
    sessionStorage.setItem('last_activity', Date.now().toString());
    return false;
  }

  const inactivityPeriod = Date.now() - lastActivity;
  const maxInactivity = 2 * 60 * 60 * 1000; // 2 hours

  // Return true if session has timed out
  return inactivityPeriod > maxInactivity;
};
