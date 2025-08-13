import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import logger from './logger';

// Secure Supabase Configuration - Credentials injected at build time by Render
const SUPABASE_CONFIG = {
  url: '{{RENDER_SUPABASE_URL}}',
  anonKey: '{{RENDER_SUPABASE_ANON_KEY}}'
};

// Validate that build process ran successfully - with development fallback
let isDevelopmentMode = false;
if (SUPABASE_CONFIG.url.includes('{{') || SUPABASE_CONFIG.anonKey.includes('{{')) {
  // Check if we have environment variables
  const envUrl = process.env.REACT_APP_SUPABASE_URL;
  const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey && envUrl.startsWith('https://') && envKey.length > 20) {
    SUPABASE_CONFIG.url = envUrl;
    SUPABASE_CONFIG.anonKey = envKey;
    logger.info('Using development environment variables');
  } else {
    // Development mode with mock data
    isDevelopmentMode = true;
    SUPABASE_CONFIG.url = 'https://development.supabase.co';
    SUPABASE_CONFIG.anonKey = 'development-key';
    logger.warn('Running in development mode with mock data');
  }
}

logger.info(isDevelopmentMode ? 'Running in development mode' : 'Supabase configuration loaded from build-time injection');

export const supabase = isDevelopmentMode ? null : createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

export { isDevelopmentMode };

// bcrypt password hashing (Current secure format)
const hashPasswordBcrypt = async (password) => {
  try {
    logger.debug('Attempting bcrypt hash with $2a$ format...');
    logger.debug('bcrypt available:', typeof bcrypt);
    logger.debug('bcrypt.hash available:', typeof bcrypt.hash);
    
    // Use 12 salt rounds but force $2a$ format for compatibility with RPC function
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    // Force $2a$ format if bcrypt generated $2b$ format
    const compatibleHash = hash.startsWith('$2b$') ? hash.replace('$2b$', '$2a$') : hash;
    
    logger.debug('bcrypt hash successful:', compatibleHash.substring(0, 20) + '...');
    logger.debug('Hash format check - starts with $2a:', compatibleHash.startsWith('$2a$'));
    logger.debug('Salt rounds:', compatibleHash.substring(4, 6));
    
    return compatibleHash;
  } catch (error) {
    logger.error('bcrypt hash failed:', error);
    logger.error('Error details:', error.message);
    throw error; // Re-throw to prevent fallback
  }
};

// Browser-compatible password hashing using Web Crypto API (Legacy format)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'keyquest_salt_2025'); // Add salt
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Legacy SHA-256 hashing without salt (for existing users)
const hashPasswordLegacy = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password); // No salt for legacy
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Multi-format password verification
const verifyPassword = async (password, hashedPassword) => {
  try {
    // Format 1: Check if it's bcrypt format ($2a$, $2b$, $2y$)
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
      return await bcrypt.compare(password, hashedPassword);
    }
    
    // Format 2: Check if it's SHA-256 (64 characters, hex only)
    if (hashedPassword.length === 64 && /^[a-f0-9]+$/i.test(hashedPassword)) {
      // Try current format with salt first
      const currentHash = await hashPassword(password);
      if (currentHash === hashedPassword) {
        return true;
      }
      
      // Try legacy format without salt
      const legacyHash = await hashPasswordLegacy(password);
      return legacyHash === hashedPassword;
    }
    
    // Fallback: Try current format
    const inputHash = await hashPassword(password);
    return inputHash === hashedPassword;
    
  } catch (error) {
    logger.error('Password verification error:', error);
    return false;
  }
};

// Database queries with error handling and security
export class AuthService {
  
  // Login user with multi-format password support
  static async loginUser(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Development mode mock authentication
      if (isDevelopmentMode) {
        logger.info('Development mode: Mock authentication');
        return {
          id: 'dev-user-001',
          username: 'dev_admin',
          email: email,
          name: 'Development User',
          role: 'super_admin',
          is_active: true,
          failed_login_attempts: 0,
          locked_until: null
        };
      }

      // Get user data including account status fields
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, password_hash, is_active, failed_login_attempts, locked_until')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        logger.debug('Supabase error:', error);
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }

      // Check if account is active
      if (!data.is_active || data.is_active === 'false') {
        throw new Error('Account is disabled. Please contact administrator.');
      }

      // Check if account is locked
      if (data.locked_until && new Date(data.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts. Please try again later.');
      }

      // Verify password using multi-format verification
      const isValidPassword = await verifyPassword(password, data.password_hash);

      if (!isValidPassword) {
        // Increment failed login attempts
        const failedAttempts = parseInt(data.failed_login_attempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // Lock for 15 minutes after 5 failed attempts
        
        await supabase
          .from('admin_users')
          .update({
            failed_login_attempts: failedAttempts,
            locked_until: lockUntil?.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);

        if (lockUntil) {
          throw new Error('Too many failed login attempts. Account locked for 15 minutes.');
        } else {
          throw new Error(`Invalid email or password. ${5 - failedAttempts} attempts remaining.`);
        }
      }

      // Successful login - reset failed attempts and update last login
      await supabase
        .from('admin_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      // Don't return sensitive data
      const { password_hash, failed_login_attempts, locked_until, ...userData } = data;
      return userData;

    } catch (error) {
      logger.error('Login error:', error.message);
      throw new Error(error.message || 'Login failed');
    }
  }

  // Create new user (admin only)
  static async createUser(userData, creatorRole) {
    try {
      if (creatorRole !== 'super_admin' && creatorRole !== 'admin') {
        throw new Error('Insufficient permissions to create users');
      }

      const { email, password, name, role } = userData;

      if (!email || !password || !name || !role) {
        throw new Error('All fields are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password using bcrypt (most secure)
      const password_hash = await hashPasswordBcrypt(password);

      // Insert new user
      const { data, error } = await supabase
        .from('admin_users')
        .insert([
          {
            email: email.toLowerCase().trim(),
            name: name.trim(),
            role: role,
            password_hash: password_hash
          }
        ])
        .select('id, email, name, role, created_at')
        .single();

      if (error) {
        throw new Error('Failed to create user: ' + error.message);
      }

      return data;

    } catch (error) {
      logger.error('User creation error:', error.message);
      throw new Error(error.message || 'Failed to create user');
    }
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!userId || !currentPassword || !newPassword) {
        throw new Error('All fields are required');
      }

      // Get current user data
      const { data: userData, error: fetchError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, userData.password_hash);

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const { validatePassword } = await import('./auth');
      const validation = validatePassword(newPassword);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      // Hash new password using bcrypt (most secure)
      logger.debug('About to hash new password with bcrypt...');
      const newPasswordHash = await hashPasswordBcrypt(newPassword);
      logger.debug('Final hash to save:', newPasswordHash.substring(0, 30) + '...');
      logger.debug('Hash length:', newPasswordHash.length);
      logger.debug('Is bcrypt format:', newPasswordHash.startsWith('$2'));

      // Update password
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Failed to update password: ' + updateError.message);
      }

      return { success: true };

    } catch (error) {
      logger.error('Password change error:', error.message);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Get user profile
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        throw new Error('User not found');
      }

      return data;

    } catch (error) {
      logger.error('Profile fetch error:', error.message);
      throw new Error(error.message || 'Failed to fetch profile');
    }
  }

  // Update user profile
  static async updateUserProfile(userId, profileData) {
    try {
      const { name, email } = profileData;

      if (!name || !email) {
        throw new Error('Name and email are required');
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Check if email is already taken by another user
      const { data: existingUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new Error('Email is already taken by another user');
      }

      // Update profile
      const { data, error } = await supabase
        .from('admin_users')
        .update({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, name, role, updated_at')
        .single();

      if (error) {
        throw new Error('Failed to update profile: ' + error.message);
      }

      return data;

    } catch (error) {
      logger.error('Profile update error:', error.message);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // List all users (admin only)
  static async listUsers(currentUserRole) {
    try {
      if (currentUserRole !== 'super_admin' && currentUserRole !== 'admin') {
        throw new Error('Insufficient permissions to view users');
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch users: ' + error.message);
      }

      return data || [];

    } catch (error) {
      logger.error('Users fetch error:', error.message);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  // Delete user (super admin only)
  static async deleteUser(userId, currentUserRole, currentUserId) {
    try {
      if (currentUserRole !== 'super_admin') {
        throw new Error('Insufficient permissions to delete users');
      }

      if (userId === currentUserId) {
        throw new Error('Cannot delete your own account');
      }

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to delete user: ' + error.message);
      }

      return { success: true };

    } catch (error) {
      logger.error('User deletion error:', error.message);
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  // Get rate packages with filters - matching actual database schema
  static async getRatePackages(filters = {}) {
    try {
      if (isDevelopmentMode) {
        throw new Error('Development mode not supported - connect to real database');
      }

      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Query rate_packages using actual database schema
      logger.info('Querying rate_packages table with actual schema structure...');
      
      let query = supabase
        .from('rate_packages')
        .select('*');

      // Apply filters using the actual field names from provided schema
      if (filters.loanType) {
        query = query.eq('loan_type', filters.loanType);
      }
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters.propertyStatus) {
        query = query.eq('property_status', filters.propertyStatus);
      }
      if (filters.rateType) {
        query = query.eq('rate_type_category', filters.rateType);
      }
      if (filters.lockPeriod) {
        query = query.eq('lock_period', filters.lockPeriod);
      }
      if (filters.buyUnder) {
        query = query.eq('buy_under', filters.buyUnder);
      }

      // Order by id since no created_at in schema (fallback to primary key)
      const { data, error } = await query.order('id', { ascending: false });

      if (error) {
        logger.error('Supabase query error:', error);
        logger.error('Full error details:', error);
        throw new Error('Failed to fetch rate packages: ' + error.message);
      }

      logger.info(`✅ Successfully fetched ${data?.length || 0} rate packages`);
      
      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('Rate packages fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get banks - matching actual database schema (no is_active column)
  static async getBanks() {
    try {
      if (isDevelopmentMode) {
        throw new Error('Development mode not supported - connect to real database');
      }

      if (!supabase) {
        throw new Error('Database connection not available');
      }

      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Supabase banks query error:', error);
        throw new Error('Failed to fetch banks: ' + error.message);
      }

      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('Banks fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get rate types - matching actual database schema
  static async getRateTypes() {
    try {
      if (isDevelopmentMode) {
        throw new Error('Development mode not supported - connect to real database');
      }

      if (!supabase) {
        throw new Error('Database connection not available');
      }

      const { data, error } = await supabase
        .from('rate_types')
        .select('*')
        .order('rate_type', { ascending: true });

      if (error) {
        logger.error('Supabase rate_types query error:', error);
        throw new Error('Failed to fetch rate types: ' + error.message);
      }

      return { success: true, data: data || [] };

    } catch (error) {
      logger.error('Rate types fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }
}
