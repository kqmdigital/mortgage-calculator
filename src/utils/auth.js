import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Password utilities
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (userData) => {
  const payload = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, process.env.REACT_APP_JWT_SECRET);
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Password validation
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
    const tokenData = verifyToken(token);
    
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
