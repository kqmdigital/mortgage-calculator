// config/supabase.js
// Browser-compatible Supabase Configuration for HTML pages

// Development configuration - uses fallback values for local development
const SUPABASE_CONFIG = {
    // Try to use build-time injected values first, fall back to development values
    url: '{{RENDER_SUPABASE_URL}}' !== '{{RENDER_SUPABASE_URL}}' ? '{{RENDER_SUPABASE_URL}}' : 
         'https://your-project.supabase.co', // Replace with actual URL for development
    anonKey: '{{RENDER_SUPABASE_ANON_KEY}}' !== '{{RENDER_SUPABASE_ANON_KEY}}' ? '{{RENDER_SUPABASE_ANON_KEY}}' : 
             'your_supabase_anon_key_here' // Replace with actual key for development
};

// For development, use dummy/test mode if real credentials not available
const isDevelopment = SUPABASE_CONFIG.url.includes('your-project') || 
                      SUPABASE_CONFIG.url.includes('dummy') ||
                      SUPABASE_CONFIG.anonKey.includes('dummy');

if (isDevelopment) {
    console.log('🟡 Running in development mode with limited functionality');
    console.log('To enable full database features, update the Supabase credentials in public/config/supabase.js');
}

console.log('✅ Supabase configuration loaded for HTML pages');

// Security Configuration
const SECURITY_CONFIG = {
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    tokenRefreshInterval: 300000 // 5 minutes
};

// Initialize Supabase Client
let supabaseClient;
if (typeof supabase !== 'undefined' && !isDevelopment) {
    try {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
    }
} else if (isDevelopment) {
    console.log('🟡 Supabase client disabled in development mode');
    // Create mock client for development
    supabaseClient = null;
} else {
    console.error('❌ Supabase library not loaded');
}

// Enhanced Auth Service with development fallback
class AuthService {
    static async signIn(email, password) {
        try {
            if (isDevelopment) {
                // Mock authentication for development
                console.log('🟡 Mock authentication - development mode');
                return {
                    success: true,
                    user: {
                        id: 'dev-user-001',
                        email: email,
                        name: 'Development User',
                        role: 'super_admin'
                    },
                    message: 'Development login successful'
                };
            }

            if (!supabaseClient) {
                return {
                    success: false,
                    error: 'Database connection not available. Please refresh the page and try again.'
                };
            }

            // Rate limiting check
            const loginAttempts = this.getLoginAttempts(email);
            if (loginAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
                return {
                    success: false,
                    error: `Account temporarily locked due to too many failed attempts. Please try again later.`
                };
            }

            // Enhanced query with detailed user data
            const { data: users, error } = await supabaseClient
                .from('admin_users')
                .select(`
                    id,
                    username,
                    email,
                    name,
                    role,
                    password_hash,
                    is_active,
                    created_at,
                    updated_at
                `)
                .eq('email', email.toLowerCase())
                .eq('is_active', true)
                .single();

            if (error || !users) {
                this.incrementLoginAttempts(email);
                return {
                    success: false,
                    error: 'Invalid email or password. Please check your credentials and try again.'
                };
            }

            // Verify password using bcrypt
            const bcrypt = window.bcrypt;
            if (!bcrypt) {
                return {
                    success: false,
                    error: 'Authentication system not available. Please refresh and try again.'
                };
            }

            const isValidPassword = await bcrypt.compare(password, users.password_hash);
            if (!isValidPassword) {
                this.incrementLoginAttempts(email);
                return {
                    success: false,
                    error: 'Invalid email or password. Please check your credentials and try again.'
                };
            }

            // Clear login attempts on successful login
            this.clearLoginAttempts(email);

            // Create secure session
            const userSession = {
                id: users.id,
                username: users.username,
                email: users.email,
                name: users.name,
                role: users.role,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + SECURITY_CONFIG.sessionTimeout).toISOString()
            };

            // Store session securely
            this.setSession(userSession);

            return {
                success: true,
                user: users,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred. Please try again later.'
            };
        }
    }

    static async signOut() {
        try {
            if (isDevelopment) {
                console.log('🟡 Mock logout - development mode');
                this.clearSession();
                return { success: true, message: 'Development logout successful' };
            }

            // Clear local session
            this.clearSession();
            
            // If real Supabase client exists, sign out from there too
            if (supabaseClient) {
                const { error } = await supabaseClient.auth.signOut();
                if (error) {
                    console.warn('Supabase sign out warning:', error);
                }
            }

            return { success: true, message: 'Successfully logged out' };
        } catch (error) {
            console.error('Sign out error:', error);
            // Always clear local session even if Supabase fails
            this.clearSession();
            return { success: true, message: 'Logged out (with warnings)' };
        }
    }

    static async getCurrentUser() {
        try {
            if (isDevelopment) {
                // Return mock user for development
                const mockUser = {
                    id: 'dev-user-001',
                    username: 'dev_admin',
                    email: 'admin@development.local',
                    name: 'Development Admin',
                    role: 'super_admin',
                    loginTime: new Date().toISOString()
                };
                console.log('🟡 Returning mock user for development');
                return { success: true, user: mockUser };
            }

            // Check local session first
            const localSession = this.getSession();
            if (localSession && this.isSessionValid(localSession)) {
                return { success: true, user: localSession };
            }

            // Clear invalid session
            this.clearSession();
            return { success: false, user: null };
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, user: null };
        }
    }

    // Session Management
    static setSession(user) {
        try {
            const sessionData = {
                ...user,
                timestamp: Date.now()
            };
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
            console.log('✅ Session stored successfully');
        } catch (error) {
            console.error('Failed to store session:', error);
        }
    }

    static getSession() {
        try {
            const sessionData = localStorage.getItem('adminSession');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Failed to retrieve session:', error);
            return null;
        }
    }

    static clearSession() {
        try {
            localStorage.removeItem('adminSession');
            localStorage.removeItem('userPreferences');
            console.log('✅ Session cleared successfully');
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    static isSessionValid(session) {
        if (!session || !session.expiresAt) return false;
        
        const now = new Date();
        const expiryTime = new Date(session.expiresAt);
        return now < expiryTime;
    }

    // Login attempt tracking
    static getLoginAttempts(email) {
        try {
            const attempts = localStorage.getItem(`loginAttempts_${email}`);
            return attempts ? parseInt(attempts) : 0;
        } catch (error) {
            return 0;
        }
    }

    static incrementLoginAttempts(email) {
        try {
            const currentAttempts = this.getLoginAttempts(email);
            localStorage.setItem(`loginAttempts_${email}`, (currentAttempts + 1).toString());
        } catch (error) {
            console.error('Failed to increment login attempts:', error);
        }
    }

    static clearLoginAttempts(email) {
        try {
            localStorage.removeItem(`loginAttempts_${email}`);
        } catch (error) {
            console.error('Failed to clear login attempts:', error);
        }
    }
}

// Enhanced Database Service with development fallback
class DatabaseService {
    static async getBanks() {
        try {
            if (isDevelopment) {
                console.log('🟡 Returning mock banks data for development');
                return {
                    success: true,
                    data: [
                        { id: 1, name: 'OCBC', is_active: true },
                        { id: 2, name: 'DBS', is_active: true },
                        { id: 3, name: 'UOB', is_active: true },
                        { id: 4, name: 'CIMB', is_active: true }
                    ]
                };
            }

            if (!supabaseClient) {
                return { success: false, error: 'Database not available' };
            }

            const { data, error } = await supabaseClient
                .from('banks')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }
    }

    static async getRatePackages(filters = {}) {
        try {
            if (isDevelopment) {
                console.log('🟡 Returning mock rate packages data for development');
                return {
                    success: true,
                    data: [
                        {
                            id: 1,
                            bank_name: 'OCBC',
                            package_name: 'HomeSecure Fixed',
                            interest_rate: 3.25,
                            rate_type: 'Fixed',
                            lock_period: '2 Years',
                            property_type: 'Private Property',
                            loan_type: 'New Home Loan',
                            cash_rebate: 0.8,
                            legal_fee_subsidy: true
                        },
                        {
                            id: 2,
                            bank_name: 'DBS',
                            package_name: 'DBS Fixed HomeLoan',
                            interest_rate: 3.15,
                            rate_type: 'Fixed',
                            lock_period: '3 Years',
                            property_type: 'Private Property',
                            loan_type: 'New Home Loan',
                            cash_rebate: 1.0,
                            legal_fee_subsidy: false
                        }
                    ]
                };
            }

            if (!supabaseClient) {
                return { success: false, error: 'Database not available' };
            }

            let query = supabaseClient
                .from('rate_packages')
                .select(`
                    *,
                    banks!inner(name, is_active)
                `)
                .eq('banks.is_active', true);

            // Apply filters
            if (filters.loanType) {
                query = query.eq('loan_type', filters.loanType);
            }
            if (filters.propertyType) {
                query = query.eq('property_type', filters.propertyType);
            }
            if (filters.rateType) {
                query = query.eq('rate_type', filters.rateType);
            }

            const { data, error } = await query.order('interest_rate');

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Database error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make services available globally
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.supabaseClient = supabaseClient;
window.isDevelopmentMode = isDevelopment;

console.log('✅ Browser-compatible Supabase services loaded successfully');