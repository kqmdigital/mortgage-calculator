// config/env.js - Environment configuration generated at build time
// This file is generated automatically by build.js - DO NOT EDIT MANUALLY

// Environment variables injected by Render build process
window.ENV_CONFIG = {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-key-123",
    APP_NAME: "Keyquest Mortgage Admin",
    MAX_LOGIN_ATTEMPTS: 5,
    SESSION_TIMEOUT: 3600000
};

// Debug logging
console.log('🔧 Environment configuration loaded:', {
    SUPABASE_URL: window.ENV_CONFIG.SUPABASE_URL ? '✅ Set' : '❌ Missing',
    SUPABASE_ANON_KEY: window.ENV_CONFIG.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    APP_NAME: window.ENV_CONFIG.APP_NAME
});

console.log('✅ Build-time environment configuration ready');
