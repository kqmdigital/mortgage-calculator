# Deployment Guide

## Render Deployment with Secure Environment Variables

This project uses build-time environment variable injection for enhanced security, following the same pattern as the external admin site.

### Environment Variables Setup

1. **In Render Dashboard**:
   - Go to your service settings
   - Navigate to "Environment" tab
   - Add these environment variables:

   ```
   RENDER_SUPABASE_URL=https://your-project.supabase.co
   RENDER_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **Build Configuration**:
   - Build Command: `npm run build`
   - Publish Directory: `build`

### How It Works

1. **Build Process**: The `npm run build` command first runs `scripts/inject-env.js`
2. **Variable Injection**: Script replaces placeholders in `src/utils/supabase.js` with actual values
3. **Security**: No sensitive data is committed to GitHub
4. **Validation**: Build fails if environment variables are missing

### Local Development

For local development, create a `.env` file (not committed to git):

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Use `npm run build:local` for local builds without injection.

### Security Features

- ✅ No secrets in source code
- ✅ No secrets in GitHub repository  
- ✅ Build-time validation
- ✅ Runtime validation
- ✅ Clear error messages for misconfiguration

### Troubleshooting

**Build fails with "Environment variables not injected"**:
1. Check Render dashboard environment variables are set
2. Verify variable names match exactly
3. Check build logs for injection script output

**Runtime error about placeholders**:
1. Build process didn't run correctly
2. Check build command includes `node scripts/inject-env.js`
3. Verify file permissions on inject script