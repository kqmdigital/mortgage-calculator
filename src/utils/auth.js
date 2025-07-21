// Browser-compatible authentication utilities
// Note: Password hashing and JWT generation should be done server-side in production

// Simple browser-compatible session token generation
export const generateSessionToken = (userData) => {
  const payload = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  
  // Base64 encode the payload (not secure, but functional for demo)
  return btoa(JSON.stringify(payload));
};

export const verifySessionToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    
    // Check if token is expired
    if (Date.now() > payload.expires) {
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

export const getUserSession = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  
  if (!token || !userData) return null;
  
  try {
    const user = JSON.parse(userData);
    const tokenData = verifySessionToken(token);
    
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

export const checkSessionTimeout = () => {
  const lastActivity = sessionStorage.getItem('last_activity');
  if (!lastActivity) return false;
  
  const timeoutDuration = 60 * 60 * 1000; // 1 hour
  const now = Date.now();
  
  if (now - parseInt(lastActivity) > timeoutDuration) {
    clearUserSession();
    return true; // Session expired
  }
  
  // Update last activity
  sessionStorage.setItem('last_activity', now.toString());
  return false;
};
