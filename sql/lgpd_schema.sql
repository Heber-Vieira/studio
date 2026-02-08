-- Enable Row Level Security if not enabled (usually is for profiles)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Privacy Consents Table
CREATE TABLE IF NOT EXISTS privacy_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('terms', 'marketing', 'cookies')),
    agreed BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for privacy_consents
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
    ON privacy_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
    ON privacy_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
    ON privacy_consents FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'login', 'export_data', 'delete_account', 'update_profile'
    resource VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for audit_logs (Admins can view all, users can view their own?)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins or the user themselves should see logs? For now let's allow users to see their own logs if needed for "History"
CREATE POLICY "Users can view their own logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = actor_id);

-- Only system/backend usually inserts logs, or strictly authenticated users for their own actions
CREATE POLICY "Users can insert their own logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() = actor_id);


-- 3. Add Anonymization Columns
-- Check if column exists first to avoid errors if re-running
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'anonymized_at') THEN
        ALTER TABLE profiles ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'anonymized_at') THEN
        ALTER TABLE clients ADD COLUMN anonymized_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
