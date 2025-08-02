// utils/passwordUtils.js
// Password hashing utilities that match your existing authentication system

import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt (most secure)
 * This is now the current implementation in your supabase.js file
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = 12; // Higher security level than existing database hashes
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify a password against a hash (multi-format support)
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    // Check if it's bcrypt format (starts with $2a$, $2b$, $2y$)
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
      return await bcrypt.compare(password, hashedPassword);
    }
    
    // Legacy SHA-256 verification (for existing users)
    const encoder = new TextEncoder();
    
    // Try current format with salt first
    const dataWithSalt = encoder.encode(password + 'keyquest_salt_2025');
    const hashWithSalt = await crypto.subtle.digest('SHA-256', dataWithSalt);
    const hashArrayWithSalt = Array.from(new Uint8Array(hashWithSalt));
    const currentHash = hashArrayWithSalt.map(b => b.toString(16).padStart(2, '0')).join('');
    if (currentHash === hashedPassword) {
      return true;
    }
    
    // Try legacy format without salt
    const dataLegacy = encoder.encode(password);
    const hashLegacy = await crypto.subtle.digest('SHA-256', dataLegacy);
    const hashArrayLegacy = Array.from(new Uint8Array(hashLegacy));
    const legacyHash = hashArrayLegacy.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHash === hashedPassword;
    
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  // Ensure password meets requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    // Regenerate if requirements not met
    return generateSecurePassword(length);
  }
  
  return password;
};

/**
 * Console utility to hash passwords for database insertion
 * Usage: Run this in browser console to get hashed passwords
 */
window.hashPasswordForDB = async (password) => {
  try {
    const hash = await hashPassword(password);
    console.log('Password:', password);
    console.log('Hashed (bcrypt):', hash);
    console.log('SQL Insert Example:');
    console.log(`INSERT INTO admin_users (email, name, role, password_hash) VALUES ('user@example.com', 'User Name', 'admin', '${hash}');`);
    return hash;
  } catch (error) {
    console.error('Hashing failed:', error);
  }
};

/**
 * Bulk user creation utility
 * Creates SQL statements for multiple users
 */
export const generateBulkUserSQL = async (users) => {
  const statements = [];
  
  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);
    const sql = `INSERT INTO admin_users (email, name, role, password_hash) VALUES ('${user.email}', '${user.name}', '${user.role}', '${hashedPassword}') ON CONFLICT (email) DO NOTHING;`;
    statements.push(sql);
  }
  
  return statements.join('\n');
};

/**
 * Default users for initial setup
 */
export const getDefaultUsers = () => [
  {
    email: 'admin@keyquestmortgage.com.sg',
    name: 'System Administrator',
    role: 'super_admin',
    password: 'KeyQuest2025!Admin' // Change this!
  },
  {
    email: 'kenneth@keyquestmortgage.com.sg', 
    name: 'Kenneth (Manager)',
    role: 'admin',
    password: 'Kenneth2025!Mgr' // Change this!
  },
  {
    email: 'analyst@keyquestmortgage.com.sg',
    name: 'Financial Analyst', 
    role: 'editor',
    password: 'Analyst2025!Fin' // Change this!
  }
];

/**
 * Initialize default users - generates SQL for database
 */
export const initializeDefaultUsers = async () => {
  const users = getDefaultUsers();
  const sql = await generateBulkUserSQL(users);
  
  console.log('=== DEFAULT USERS SQL ===');
  console.log('Copy and run this in your Supabase SQL editor:');
  console.log('');
  console.log(sql);
  console.log('');
  console.log('=== USER CREDENTIALS ===');
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Role: ${user.role}`);
    console.log('---');
  });
  console.log('⚠️  IMPORTANT: Change these passwords after first login!');
  
  return { sql, users };
};

/**
 * Password strength validator (matches your auth.js)
 */
export const validatePasswordStrength = (password) => {
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

  const score = [
    password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  ].filter(Boolean).length;

  let strength = 'Very Weak';
  if (score >= 5) strength = 'Very Strong';
  else if (score >= 4) strength = 'Strong';
  else if (score >= 3) strength = 'Moderate';
  else if (score >= 2) strength = 'Weak';

  return {
    isValid: errors.length === 0,
    errors,
    score,
    strength
  };
};

// Console helper functions for development
if (typeof window !== 'undefined') {
  window.keyquestPasswordUtils = {
    hashPassword,
    verifyPassword,
    generateSecurePassword,
    validatePasswordStrength,
    initializeDefaultUsers,
    
    // Quick setup helper
    quickSetup: async () => {
      console.log('🔐 KeyQuest Password Utility');
      console.log('Use these functions to manage passwords:');
      console.log('');
      console.log('• hashPasswordForDB("yourpassword") - Hash a password for DB');
      console.log('• keyquestPasswordUtils.generateSecurePassword() - Generate random password');
      console.log('• keyquestPasswordUtils.initializeDefaultUsers() - Setup default users');
      console.log('• keyquestPasswordUtils.validatePasswordStrength("password") - Check strength');
      console.log('');
      
      // Auto-generate default users
      await initializeDefaultUsers();
    }
  };
  
  // Auto-run on load in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 KeyQuest Password Utils loaded. Run keyquestPasswordUtils.quickSetup() to get started.');
  }
}
