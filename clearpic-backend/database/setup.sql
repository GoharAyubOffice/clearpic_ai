-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if auth schema exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        RAISE EXCEPTION 'Auth schema does not exist. Please ensure Supabase Auth is properly set up.';
    END IF;
END $$;

-- Check if auth.users table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE EXCEPTION 'Auth users table does not exist. Please ensure Supabase Auth is properly set up.';
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    credits INTEGER DEFAULT 0,
    subscription_status TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;
DROP POLICY IF EXISTS "Users can manage own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policies for credit_transactions
CREATE POLICY "Users can manage own credit transactions"
    ON credit_transactions
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policies for subscriptions
CREATE POLICY "Users can manage own subscriptions"
    ON subscriptions
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create service role bypass policies
CREATE POLICY "Service role bypass profiles"
    ON profiles
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass credit_transactions"
    ON credit_transactions
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role bypass subscriptions"
    ON subscriptions
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON credit_transactions TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON credit_transactions TO service_role;
GRANT ALL ON subscriptions TO service_role;

-- Create function to handle automatic profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create function to handle RLS bypass
CREATE OR REPLACE FUNCTION handle_rls_bypass()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION handle_rls_bypass() TO service_role;

-- Create triggers for RLS bypass
DROP TRIGGER IF EXISTS rls_bypass_trigger ON profiles;
CREATE TRIGGER rls_bypass_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_rls_bypass();

DROP TRIGGER IF EXISTS rls_bypass_trigger ON credit_transactions;
CREATE TRIGGER rls_bypass_trigger
    BEFORE INSERT OR UPDATE ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_rls_bypass();

DROP TRIGGER IF EXISTS rls_bypass_trigger ON subscriptions;
CREATE TRIGGER rls_bypass_trigger
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_rls_bypass(); 