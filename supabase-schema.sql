-- Supabase Database Schema for ReliefLink Lite
-- Kenyan Humanitarian Aid App Database Structure

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT,
    location TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help requests table
CREATE TABLE help_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    help_category TEXT NOT NULL, -- 'medical', 'food', 'shelter', 'transportation', 'other'
    urgency_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    people_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active', -- 'active', 'matched', 'fulfilled', 'cancelled'
    additional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help offers table
CREATE TABLE help_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- 'individual', 'ngo', 'government', 'business', 'religious'
    help_types TEXT[] NOT NULL, -- Array of help categories they can provide
    provider_location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER DEFAULT 1,
    availability TEXT NOT NULL, -- 'immediate', 'within_hours', 'within_days'
    service_radius INTEGER DEFAULT 10, -- kilometers
    description TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'busy', 'inactive'
    additional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table (connects requests with offers)
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES help_offers(id) ON DELETE CASCADE,
    match_score DECIMAL(5, 2), -- Matching algorithm score
    match_reasons TEXT[], -- Array of matching criteria
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, offer_id)
);

-- Activity log for tracking system activity
CREATE TABLE activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- 'request_created', 'offer_created', 'match_made', etc.
    description TEXT NOT NULL,
    related_id UUID, -- ID of related request/offer/match
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_category ON help_requests(help_category);
CREATE INDEX idx_help_requests_urgency ON help_requests(urgency_level);
CREATE INDEX idx_help_requests_location ON help_requests(latitude, longitude);
CREATE INDEX idx_help_requests_created_at ON help_requests(created_at);

CREATE INDEX idx_help_offers_status ON help_offers(status);
CREATE INDEX idx_help_offers_types ON help_offers USING GIN(help_types);
CREATE INDEX idx_help_offers_location ON help_offers(latitude, longitude);
CREATE INDEX idx_help_offers_created_at ON help_offers(created_at);

CREATE INDEX idx_matches_request_id ON matches(request_id);
CREATE INDEX idx_matches_offer_id ON matches(offer_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Row Level Security Policies

-- User profiles - users can only see their own profile and admins can see all
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );

-- Help requests - public read, authenticated users can create, owners and admins can update
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view help requests" ON help_requests
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create requests" ON help_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own requests" ON help_requests
    FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Admins can update all requests" ON help_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );

-- Help offers - public read, authenticated users can create, owners and admins can update
ALTER TABLE help_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view help offers" ON help_offers
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create offers" ON help_offers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own offers" ON help_offers
    FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Admins can update all offers" ON help_offers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );

-- Matches - public read, system can create, related users and admins can update
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON matches
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create matches" ON matches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Request owners can update matches" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM help_requests 
            WHERE id = request_id AND requester_id = auth.uid()
        )
    );

CREATE POLICY "Offer owners can update matches" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM help_offers 
            WHERE id = offer_id AND provider_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update all matches" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );

-- Activity log - public read, authenticated users can create
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity log" ON activity_log
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create activity log entries" ON activity_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_requests_updated_at 
    BEFORE UPDATE ON help_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_offers_updated_at 
    BEFORE UPDATE ON help_offers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();