#!/usr/bin/env node

// Environment Variable Injection Script for Render Deployment
// This script replaces placeholders with actual environment variables during build

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, '..', 'src', 'utils', 'supabase.js');

console.log('🔧 Starting environment variable injection...');

// Read the file
let fileContent = fs.readFileSync(TARGET_FILE, 'utf8');

// Get environment variables from Render
const SUPABASE_URL = process.env.RENDER_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.RENDER_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables exist
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('- RENDER_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('- RENDER_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  console.error('');
  console.error('Set these in your Render dashboard:');
  console.error('1. Go to your service settings');
  console.error('2. Add Environment Variables:');
  console.error('   RENDER_SUPABASE_URL = your_supabase_url');
  console.error('   RENDER_SUPABASE_ANON_KEY = your_supabase_anon_key');
  process.exit(1);
}

// Replace placeholders with actual values
fileContent = fileContent.replace('{{RENDER_SUPABASE_URL}}', SUPABASE_URL);
fileContent = fileContent.replace('{{RENDER_SUPABASE_ANON_KEY}}', SUPABASE_ANON_KEY);

// Write back to file
fs.writeFileSync(TARGET_FILE, fileContent);

console.log('✅ Environment variables injected successfully');
console.log('📂 File updated:', TARGET_FILE);
console.log('🔒 Variables injected:');
console.log('- SUPABASE_URL:', SUPABASE_URL.substring(0, 30) + '...');
console.log('- SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.substring(0, 20) + '...');