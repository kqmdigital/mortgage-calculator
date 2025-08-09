// config/env.js - Environment configuration for browser-based pages
// This mirrors the React app's environment variable injection pattern

// Environment variables - using same pattern as inject-env.js
// These will be replaced by build process or set by development environment
const RENDER_SUPABASE_URL = '{{RENDER_SUPABASE_URL}}';
const RENDER_SUPABASE_ANON_KEY = '{{RENDER_SUPABASE_ANON_KEY}}';

// Check if build-time injection occurred
let envUrl = RENDER_SUPABASE_URL;
let envKey = RENDER_SUPABASE_ANON_KEY;

// If placeholders weren't replaced, try development fallbacks
if (RENDER_SUPABASE_URL.includes('{{')) {
    // Try to get from process.env (development)
    if (typeof process !== 'undefined' && process.env) {
        envUrl = process.env.RENDER_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
        envKey = process.env.RENDER_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
    }
}

// Set global ENV_CONFIG for browser access
window.ENV_CONFIG = {
    SUPABASE_URL: envUrl,
    SUPABASE_ANON_KEY: envKey,
    APP_NAME: "Keyquest Mortgage Admin",
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000
};

// Debug logging (same as React app pattern)
console.log('🔧 Environment configuration loaded:', {
    SUPABASE_URL: window.ENV_CONFIG.SUPABASE_URL && !window.ENV_CONFIG.SUPABASE_URL.includes('{{') ? '✅ Set' : '❌ Missing',
    SUPABASE_ANON_KEY: window.ENV_CONFIG.SUPABASE_ANON_KEY && !window.ENV_CONFIG.SUPABASE_ANON_KEY.includes('{{') ? '✅ Set' : '❌ Missing',
    APP_NAME: window.ENV_CONFIG.APP_NAME
});

// Validate same as React app
if (window.ENV_CONFIG.SUPABASE_URL.includes('{{') || window.ENV_CONFIG.SUPABASE_ANON_KEY.includes('{{')) {
    console.log('🟡 Environment variables not injected - will use development mode');
} else {
    console.log('✅ Build-time environment configuration ready');
}
