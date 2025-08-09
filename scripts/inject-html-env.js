#!/usr/bin/env node

// Environment Variable Injection Script for HTML pages
// This script replaces placeholders in public/config/env.js during build

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, '..', 'public', 'config', 'env.js');

console.log('🔧 Starting HTML environment variable injection...');

// Read the file
let fileContent = fs.readFileSync(TARGET_FILE, 'utf8');

// Get environment variables from Render (same pattern as inject-env.js)
const SUPABASE_URL = process.env.RENDER_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.RENDER_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables exist
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('⚠️ No valid environment variables found for HTML pages');
    console.log('HTML pages will run in development mode with mock data');
    console.log('To enable real database connection:');
    console.log('1. Set RENDER_SUPABASE_URL and RENDER_SUPABASE_ANON_KEY in Render dashboard');
    console.log('2. Or set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY for development');
    return;
}

// Replace placeholders with actual values
fileContent = fileContent.replace('{{RENDER_SUPABASE_URL}}', SUPABASE_URL);
fileContent = fileContent.replace('{{RENDER_SUPABASE_ANON_KEY}}', SUPABASE_ANON_KEY);

// Write back to file
fs.writeFileSync(TARGET_FILE, fileContent);

console.log('✅ HTML environment variables injected successfully');
console.log('📂 File updated:', TARGET_FILE);
console.log('🔒 Variables injected:');
console.log('- SUPABASE_URL:', SUPABASE_URL.substring(0, 30) + '...');
console.log('- SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');