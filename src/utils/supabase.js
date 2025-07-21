import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Database queries with error handling and security
export class AuthService {
  
  // Login user
  static async loginUser(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, password_hash')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password');
      }

      // Import bcrypt dynamically for better performance
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, data.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Don't return password hash
      const { password_hash, ...userData } = data;
      return userData;

    } catch (error) {
      console.error('Login error:', error.message);
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

      // Hash password
      const bcrypt = await import('bcryptjs');
      const password_hash = await bcrypt.hash(password, 12);

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
      console.error('User creation error:', error.message);
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
      const bcrypt = await import('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const { validatePassword } = await import('./auth');
      const validation = validatePassword(newPassword);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

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
      console.error('Password change error:', error.message);
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
      console.error('Profile fetch error:', error.message);
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
      console.error('Profile update error:', error.message);
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
      console.error('Users fetch error:', error.message);
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
      console.error('User deletion error:', error.message);
      throw new Error(error.message || 'Failed to delete user');
    }
  }
}
