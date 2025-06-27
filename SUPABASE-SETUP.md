# 🚀 Supabase Setup Guide for ReliefLink Lite

This guide will help you set up Supabase as the backend for your Kenyan humanitarian aid app, replacing Firebase completely.

## Step 1: Create Supabase Project

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Sign up/Sign in** with your GitHub account
3. **Create New Project**:
   - Project Name: `relieflink-lite`
   - Database Password: Choose a strong password (save it!)
   - Region: Choose closest to Kenya (e.g., `ap-southeast-1` for Singapore)
   - Click "Create new project"

## Step 2: Get Your Project Credentials

1. **Go to Settings** → **API** in your Supabase dashboard
2. **Copy these values**:
   - `Project URL` (e.g., `https://xyzabc123.supabase.co`)
   - `anon/public key` (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Your Application Configuration

1. **Open `js/supabase-config.js`**
2. **Replace the placeholder values**:
   ```javascript
   const supabaseUrl = 'https://your-project-id.supabase.co'  // Your Project URL
   const supabaseAnonKey = 'your-anon-key-here'  // Your anon/public key
   ```

## Step 4: Set Up Database Schema

1. **Go to SQL Editor** in your Supabase dashboard
2. **Copy and paste** the entire content from `supabase-schema.sql`
3. **Click "Run"** to create all tables and policies
4. **Verify setup**: Go to "Table Editor" and confirm these tables exist:
   - `user_profiles`
   - `help_requests`
   - `help_offers`
   - `matches`
   - `activity_log`

## Step 5: Configure Authentication

1. **Go to Authentication** → **Settings** in Supabase dashboard
2. **Site URL**: Add your deployment URL (e.g., `https://your-app.vercel.app`)
3. **Redirect URLs**: Add the same URL with `/*` (e.g., `https://your-app.vercel.app/*`)
4. **Email Settings**: Configure email templates (optional, uses default for now)

## Step 6: Test Local Development

1. **Start your local server**: `python -m http.server 5000`
2. **Open**: `http://localhost:5000`
3. **Test registration**: Create a new account
4. **Test login**: Sign in with your account
5. **First user becomes admin** automatically
6. **Submit a help request** to test database functionality

## Step 7: Deploy to Vercel

### Option 1: Using Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option 2: Using Vercel Dashboard
1. **Connect your GitHub repo** to Vercel
2. **Deploy settings**:
   - Framework Preset: `Other`
   - Build Command: `echo "Static site ready"`
   - Output Directory: `./`
3. **Environment Variables**: None needed (credentials are in code)
4. **Deploy**

## Step 8: Configure Production URLs

1. **After deployment**, copy your Vercel URL
2. **Go back to Supabase** → **Authentication** → **Settings**
3. **Update Site URL and Redirect URLs** with your production URL
4. **Test the live app**

## Database Schema Overview

### Core Tables:
- **`help_requests`**: Emergency assistance requests
- **`help_offers`**: Aid provider registrations  
- **`matches`**: Connects requests with offers
- **`user_profiles`**: User info and admin status
- **`activity_log`**: System activity tracking

### Key Features:
- **Row Level Security**: Automatic data protection
- **Real-time subscriptions**: Live updates
- **Automatic admin**: First user becomes admin
- **Kenyan context**: Optimized for local use

### Sample Data Types:

**Help Categories**: `medical`, `food`, `shelter`, `transportation`, `other`

**Urgency Levels**: `low`, `medium`, `high`, `critical`

**Provider Types**: `individual`, `ngo`, `government`, `business`, `religious`

## Advanced Configuration (Optional)

### Edge Functions for Matching Algorithm
If you want to move the matching logic to the server:

1. **Install Supabase CLI**: `npm install -g supabase`
2. **Login**: `supabase login`
3. **Link project**: `supabase link --project-ref your-project-id`
4. **Create function**: `supabase functions new match-requests`
5. **Deploy**: `supabase functions deploy match-requests`

### Real-time Subscriptions
Already configured in the code for:
- Live updates on new help requests
- Live updates on new help offers
- Real-time matching notifications

### Security Features
- Email verification for new users
- Row-level security policies
- Admin-only access controls
- Secure API key management

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your URL and anon key
2. **Database connection failed**: Verify your project is active
3. **Authentication not working**: Check redirect URLs
4. **Tables not found**: Run the schema SQL again

### Testing Checklist:
- [ ] User registration works
- [ ] User login works  
- [ ] Help requests can be submitted
- [ ] Help offers can be created
- [ ] Admin dashboard loads
- [ ] Matching algorithm runs
- [ ] Real-time updates work

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Status Page**: https://status.supabase.com

Your ReliefLink Lite app is now ready for real-world deployment in Kenya! 🇰🇪