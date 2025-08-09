# Database Configuration Setup

The recommended packages webpage is currently using **mock data** because it cannot find valid Supabase credentials.

## 🔍 Current Issue

The system checks for Supabase credentials in this order:
1. Build-time injected values (for production)
2. Window ENV_CONFIG 
3. React environment variables
4. Falls back to mock data if none found

Currently all sources contain test/dummy values, so the system uses mock data.

## 🔑 To Enable Real Database Connection

You need to provide your **actual Supabase project credentials**:

### Step 1: Get Your Supabase Credentials

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project 
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://yourproject.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

### Step 2: Update Your Local Environment

Replace the dummy values in your `.env` file:

```bash
# Replace these dummy values with your real Supabase credentials
REACT_APP_SUPABASE_URL=https://yourproject.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your-actual-key
```

### Step 3: Restart Development Server

```bash
npm start
```

## 🗄️ Required Database Tables

Your Supabase database should have these tables for the recommended packages to work:

- **`admin_users`** - For authentication
- **`banks`** - Bank information  
- **`rate_packages`** - Mortgage rate packages
- **`rate_types`** - Fixed/Floating rate types

## 📝 Next Steps

1. **Provide your Supabase credentials** (URL and anon key)
2. I'll help update the configuration 
3. Test the real database connection
4. Verify all package data loads correctly

---

**Current Status**: Using mock data with 2 sample packages
**Goal**: Connect to real Supabase database with actual mortgage packages