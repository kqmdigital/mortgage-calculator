// config/supabase.js
// Secure Supabase Configuration - Credentials injected at build time by Render
const SUPABASE_CONFIG = {
    url: '{{RENDER_SUPABASE_URL}}',
    anonKey: '{{RENDER_SUPABASE_ANON_KEY}}'
};

// Validate that build process ran successfully
if (SUPABASE_CONFIG.url.includes('{{') || SUPABASE_CONFIG.anonKey.includes('{{')) {
    console.error('❌ Build process failed to inject environment variables');
    console.error('Placeholders were not replaced. Please check:');
    console.error('1. Environment variables are set in Render dashboard');
    console.error('2. Build command "npm run build" is configured');
    console.error('3. build.js has proper file permissions');
    throw new Error('Environment variables not injected. Build process failed.');
}

console.log('✅ Supabase configuration loaded from build-time injection');

// Security Configuration
const SECURITY_CONFIG = {
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    tokenRefreshInterval: 300000 // 5 minutes
};

// Initialize Supabase Client
// Check if supabase is available globally (UMD version)
let supabaseClient;
if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase client initialized successfully');
} else {
    console.error('❌ Supabase library not loaded');
}

// Enhanced Auth Service with improved security
class AuthService {
    static async signIn(email, password) {
        try {
            // Check if supabaseClient is available
            if (!supabaseClient) {
                return {
                    success: false,
                    error: 'Database connection not available. Please refresh the page and try again.'
                };
            }

            // Rate limiting check (if available)
            if (typeof loginRateLimiter === 'function' && !loginRateLimiter(email)) {
                return { 
                    success: false, 
                    error: 'Too many login attempts. Please try again in 15 minutes.' 
                };
            }

            // Use custom authentication with existing password hashes
  const { data, error } = await supabaseClient.rpc('authenticate_admin', {
      user_email: email,
      user_password: password
  });

  // ADD THIS DEBUGGING BLOCK
  console.log('🔍 RPC Response:', { data, error });
  if (data) {
      console.log('🔍 RPC data.success:', data.success);
      console.log('🔍 RPC data.message:', data.message);
      console.log('🔍 RPC data.user:', data.user);
  } else {
      console.log('🔍 RPC returned no data');
  }
  // END DEBUGGING BLOCK

  if (error) {
      console.error('Authentication error:', error);
      return {
          success: false,
          error: 'Invalid email or password'
      };
  }

  if (!data || !data.success) {
      return { success: false, error: data?.message || 'Invalid credentials' };
  }

            // Get admin data from the response
            const adminData = data.user;

            // Store secure session data
            const userSession = {
                id: adminData.id,
                email: adminData.email,
                name: adminData.name,
                role: adminData.role,
                loginTime: new Date().toISOString()
            };
            
            // Use secure storage with expiration (fallback to localStorage)
            if (typeof SecurityUtils !== 'undefined' && SecurityUtils.secureStorage) {
                SecurityUtils.secureStorage.set(
                    'admin_session', 
                    userSession, 
                    SECURITY_CONFIG.sessionTimeout
                );
            } else {
                // Fallback to localStorage with manual expiration
                localStorage.setItem('admin_session', JSON.stringify(userSession));
                localStorage.setItem('session_expires', (Date.now() + SECURITY_CONFIG.sessionTimeout).toString());
            }

            // Update last login
            await this.updateLastLogin(adminData.id);

            return { success: true, user: userSession };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }

    static async signOut() {
        try {
            // Clear secure storage (with fallback)
            if (typeof SecurityUtils !== 'undefined' && SecurityUtils.secureStorage) {
                SecurityUtils.secureStorage.clear();
            } else {
                // Fallback: clear localStorage
                localStorage.removeItem('admin_session');
                localStorage.removeItem('session_expires');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    static async getCurrentUser() {
        try {
            // Get user data from secure storage (with fallback)
            let userData = null;
            
            if (typeof SecurityUtils !== 'undefined' && SecurityUtils.secureStorage) {
                userData = SecurityUtils.secureStorage.get('admin_session');
            } else {
                // Fallback: use localStorage with manual expiration check
                const sessionData = localStorage.getItem('admin_session');
                const sessionExpires = localStorage.getItem('session_expires');
                
                if (sessionData && sessionExpires) {
                    if (Date.now() < parseInt(sessionExpires)) {
                        userData = JSON.parse(sessionData);
                    } else {
                        // Expired, clear it
                        localStorage.removeItem('admin_session');
                        localStorage.removeItem('session_expires');
                    }
                }
            }
            
            if (!userData) {
                console.log('❌ No local session data found or session expired');
                return { success: false, user: null };
            }

            console.log('✅ Session valid, user:', userData);
            return { success: true, user: userData };
        } catch (error) {
            console.error('❌ Get user error:', error);
            console.log('🧹 Clearing corrupted session...');
            
            // Clear both secure storage and localStorage
            try {
                if (typeof SecurityUtils !== 'undefined' && SecurityUtils.secureStorage) {
                    SecurityUtils.secureStorage.clear();
                }
                localStorage.removeItem('admin_session');
                localStorage.removeItem('session_expires');
            } catch (clearError) {
                console.error('Error clearing session:', clearError);
            }
            
            return { success: false, error: error.message };
        }
    }

    static async updateLastLogin(userId) {
        try {
            if (!supabaseClient) {
                console.warn('Cannot update last login: Supabase client not available');
                return;
            }
            
            await supabaseClient
                .from('admin_users')
                .update({ 
                    last_login: new Date().toISOString(),
                    failed_login_attempts: 0,
                    locked_until: null
                })
                .eq('id', userId);
        } catch (error) {
            console.error('Update last login error:', error);
        }
    }

    static async checkAuthAndRedirect() {
        const { user } = await this.getCurrentUser();
        if (!user && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static isLoggedIn() {
        const sessionData = localStorage.getItem('admin_session');
        const sessionExpires = localStorage.getItem('session_expires');
        
        return sessionData && sessionExpires && Date.now() < parseInt(sessionExpires);
    }

    // Admin User Management Functions (Super Admin Only)
    static async getAllAdminUsers() {
        try {
            const { user } = await this.getCurrentUser();
            if (!user || user.role !== 'super_admin') {
                return { success: false, error: 'Unauthorized: Super admin access required' };
            }

            const { data, error } = await supabaseClient.rpc('get_admin_users', {
                admin_email: user.email
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get admin users error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createAdminUser(userData) {
        try {
            const { user } = await this.getCurrentUser();
            if (!user || user.role !== 'super_admin') {
                return { success: false, error: 'Unauthorized: Super admin access required' };
            }

            const { data, error } = await supabaseClient.rpc('create_admin_user', {
                creator_email: user.email,
                new_name: userData.name,
                new_email: userData.email,
                new_password: userData.password,
                new_role: userData.role || 'admin'
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create admin user error:', error);
            return { success: false, error: error.message };
        }
    }

    static async resetUserPassword(targetEmail, newPassword) {
        try {
            const { user } = await this.getCurrentUser();
            if (!user || user.role !== 'super_admin') {
                return { success: false, error: 'Unauthorized: Super admin access required' };
            }

            const { data, error } = await supabaseClient.rpc('reset_user_password', {
                admin_email: user.email,
                target_email: targetEmail,
                new_password: newPassword
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deactivateUser(targetEmail) {
        try {
            const { user } = await this.getCurrentUser();
            if (!user || user.role !== 'super_admin') {
                return { success: false, error: 'Unauthorized: Super admin access required' };
            }

            const { data, error } = await supabaseClient.rpc('deactivate_admin_user', {
                admin_email: user.email,
                target_email: targetEmail
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Deactivate user error:', error);
            return { success: false, error: error.message };
        }
    }

    static async reactivateUser(targetEmail) {
        try {
            const { user } = await this.getCurrentUser();
            if (!user || user.role !== 'super_admin') {
                return { success: false, error: 'Unauthorized: Super admin access required' };
            }

            const { data, error } = await supabaseClient.rpc('reactivate_admin_user', {
                admin_email: user.email,
                target_email: targetEmail
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Reactivate user error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Database Helper Functions
class DatabaseService {
    // Banks
    static async getBanks() {
        try {
            const { data, error } = await supabaseClient
                .from('banks')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get banks error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createBank(name) {
        try {
            const { data, error } = await supabaseClient
                .from('banks')
                .insert([{ name }])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create bank error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateBank(id, name) {
        try {
            const { data, error } = await supabaseClient
                .from('banks')
                .update({ name, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update bank error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteBank(id) {
        try {
            const { error } = await supabaseClient
                .from('banks')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete bank error:', error);
            return { success: false, error: error.message };
        }
    }

    // Agents
    static async getAgents() {
        try {
            const { data, error } = await supabaseClient
                .from('agents')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get agents error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createAgent(agent) {
        try {
            const { data, error } = await supabaseClient
                .from('agents')
                .insert([agent])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create agent error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateAgent(id, agent) {
        try {
            const { data, error } = await supabaseClient
                .from('agents')
                .update({ ...agent, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update agent error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteAgent(id) {
        try {
            const { error } = await supabaseClient
                .from('agents')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete agent error:', error);
            return { success: false, error: error.message };
        }
    }

    // Bankers
    static async getBankers() {
        try {
            const { data, error } = await supabaseClient
                .from('bankers')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get bankers error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createBanker(banker) {
        try {
            const { data, error } = await supabaseClient
                .from('bankers')
                .insert([banker])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create banker error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateBanker(id, banker) {
        try {
            const { data, error } = await supabaseClient
                .from('bankers')
                .update({ ...banker, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update banker error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteBanker(id) {
        try {
            const { error } = await supabaseClient
                .from('bankers')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete banker error:', error);
            return { success: false, error: error.message };
        }
    }

    // Rate Types
    static async getRateTypes() {
        try {
            const { data, error } = await supabaseClient
                .from('rate_types')
                .select('*')
                .order('rate_type');
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get rate types error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createRateType(rateType) {
        try {
            const { data, error } = await supabaseClient
                .from('rate_types')
                .insert([rateType])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create rate type error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateRateType(id, rateType) {
        try {
            const { data, error } = await supabaseClient
                .from('rate_types')
                .update({ ...rateType, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update rate type error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteRateType(id) {
        try {
            const { error } = await supabaseClient
                .from('rate_types')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete rate type error:', error);
            return { success: false, error: error.message };
        }
    }

    // Rate Packages
    static async getRatePackages() {
        try {
            const { data, error } = await supabaseClient
                .from('rate_packages')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get rate packages error:', error);
            return { success: false, error: error.message };
        }
    }

    static async createRatePackage(ratePackage) {
        try {
            const { data, error } = await supabaseClient
                .from('rate_packages')
                .insert([ratePackage])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create rate package error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateRatePackage(id, ratePackage) {
        try {
            const { data, error } = await supabaseClient
                .from('rate_packages')
                .update({ ...ratePackage, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update rate package error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteRatePackage(id) {
        try {
            const { error } = await supabaseClient
                .from('rate_packages')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete rate package error:', error);
            return { success: false, error: error.message };
        }
    }

    // Enquiries
    static async getEnquiries() {
        try {
            const { data, error } = await supabaseClient
                .from('enquiries')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get enquiries error:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateEnquiryStatus(id, status) {
        try {
            const { data, error } = await supabaseClient
                .from('enquiries')
                .update({ status, updated_at: new Date() })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update enquiry status error:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteEnquiry(id) {
        try {
            const { error } = await supabaseClient
                .from('enquiries')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete enquiry error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Loading State Helper
class LoadingService {
    static show(message = 'Loading...') {
        // Remove existing loader
        this.hide();
        
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                ">
                    <div style="
                        width: 20px;
                        height: 20px;
                        border: 2px solid #e2e8f0;
                        border-top: 2px solid #4338ca;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <span style="color: #374151; font-weight: 500;">${message}</span>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loader);
    }

    static hide() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.remove();
        }
    }

    static async withLoading(asyncFunction, message = 'Loading...') {
        this.show(message);
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            this.hide();
        }
    }
}

// Utility Functions
class Utils {
    static showSuccess(message) {
        this.showNotification(message, 'success');
    }

    static showError(message) {
        this.showNotification(message, 'error');
    }

    static showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const colors = {
            success: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
            error: { bg: '#fef2f2', border: '#dc2626', text: '#dc2626' },
            info: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' }
        };

        const color = colors[type] || colors.info;

        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${color.bg};
                border: 1px solid ${color.border};
                color: ${color.text};
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            ">
                ${message}
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-SG');
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString('en-SG');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, DatabaseService, LoadingService, Utils };
}
