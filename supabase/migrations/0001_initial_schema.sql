-- CARETAI Initial Database Migration
-- Supabase schema for Clinical Analysis for Responsive Evaluation & Tracking using AI
-- This migration creates 7 tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for hashed passwords (though we don't store passwords directly)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

----------------------------------------------------------------------------------------
-- 1. profiles table
-- References auth.users(id) for Supabase Auth integration
-- Stores user role and onboarding status
----------------------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'caregiver', 'doctor', 'admin')),
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    language TEXT NOT NULL DEFAULT 'English' CHECK (language IN ('English', 'বাংলা')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

----------------------------------------------------------------------------------------
-- 2. patient_caregivers table
-- Links patients to caregivers with explicit approval
-- No permissive insert policy - relationship creation restricted until invitation/approval flow
----------------------------------------------------------------------------------------
CREATE TABLE patient_caregivers (
    patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (patient_id, caregiver_id)
);

-- Indexes for caregiver lookups
CREATE INDEX idx_patient_caregivers_patient ON patient_caregivers(patient_id);
CREATE INDEX idx_patient_caregivers_caregiver ON patient_caregivers(caregiver_id);

----------------------------------------------------------------------------------------
-- 3. visits table
-- Patient visit records, linked to patient profiles
----------------------------------------------------------------------------------------
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('Chat', 'Voice', 'Video')),
    language TEXT NOT NULL DEFAULT 'English' CHECK (language IN ('English', 'বাংলা')),
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Reviewed', 'Cancelled')),
    duration_minutes INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for patient visit lookups
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_start_time ON visits(start_time);

----------------------------------------------------------------------------------------
-- 4. messages table
-- Messages exchanged between patients, caregivers, and doctors within visit context
-- author: 'CARETAI' (system), 'Patient', 'Caregiver', or 'Doctor'
----------------------------------------------------------------------------------------
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    author TEXT NOT NULL CHECK (author IN ('CARETAI', 'Patient', 'Caregiver', 'Doctor')),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for message lookups
CREATE INDEX idx_messages_visit ON messages(visit_id);
CREATE INDEX idx_messages_author ON messages(author);

----------------------------------------------------------------------------------------
-- 5. reports table
-- Clinical reports generated for visits
-- Status: Draft | Pending | Shared | Available | Requested
----------------------------------------------------------------------------------------
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Shared', 'Available', 'Requested')),
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for report lookups
CREATE INDEX idx_reports_visit ON reports(visit_id);
CREATE INDEX idx_reports_status ON reports(status);

----------------------------------------------------------------------------------------
-- 6. report_confirmations table
-- Audit trail for report confirmation events (patient/caregiver acknowledging receipt)
-- Separate from doctor reviews - append-only record of confirmation events
----------------------------------------------------------------------------------------
CREATE TABLE report_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('viewed', 'acknowledged', 'opened', 'emailed')),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Indexes for confirmation lookups
CREATE INDEX idx_report_confirmations_report ON report_confirmations(report_id);
CREATE INDEX idx_report_confirmations_user ON report_confirmations(user_id);

-- Comment: This table is append-only. No UPDATE or DELETE operations should be performed
-- from the application layer. New confirmation records are always inserted, never modified.

----------------------------------------------------------------------------------------
-- 7. visit_reviews table
-- Reviews of visits, but patients/caregivers cannot create or modify doctor reviews
-- Doctor reviews are separate from patient/caregiver feedback
----------------------------------------------------------------------------------------
CREATE TABLE visit_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id), -- Can be doctor or admin; patient/caregiver reviews restricted
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    review_type TEXT NOT NULL CHECK (review_type IN ('doctor', 'caregiver', 'self', 'admin')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for review lookups
CREATE INDEX idx_visit_reviews_visit ON visit_reviews(visit_id);
CREATE INDEX idx_visit_reviews_reviewer ON visit_reviews(reviewer_id);

-- Constraint: Patients and caregivers cannot create or modify doctor reviews
-- This is enforced via RLS policies and application-level validation
-- review_type 'doctor' can only be created by doctors or admins

----------------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
----------------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_reviews ENABLE ROW LEVEL SECURITY;

-- profiles RLS policies
CREATE POLICY "Patients view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- patient_caregivers RLS policies
-- No insert policy - relationship creation is restricted
CREATE POLICY "Patients view own caregiver links" ON patient_caregivers
    FOR SELECT USING (
        patient_id = auth.uid() OR caregiver_id = auth.uid()
    );

CREATE POLICY "Caregivers view own patient links" ON patient_caregivers
    FOR SELECT USING (
        caregiver_id = auth.uid()
    );

-- visits RLS policies
CREATE POLICY "Patients view own visits" ON visits
    FOR SELECT USING (
        patient_id = auth.uid()
    );

CREATE POLICY "Doctors view assigned visits" ON visits
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor')
    );

CREATE POLICY "Admins view all visits" ON visits
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- messages RLS policies
CREATE POLICY "Patients view messages own visits" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND patient_id = auth.uid())
    );

CREATE POLICY "Caregivers view messages own visits" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM patient_caregivers WHERE patient_id = visits.patient_id AND caregiver_id = auth.uid())
    );

CREATE POLICY "Doctors view assigned messages" ON messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
    );

CREATE POLICY "System messages CARETAI" ON messages
    FOR INSERT WITH CHECK (author = 'CARETAI');

-- reports RLS policies
CREATE POLICY "Patients view own reports" ON reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND patient_id = auth.uid())
    );

CREATE POLICY "Doctors view assigned reports" ON reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
    );

CREATE POLICY "Admins view all reports" ON reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- report_confirmations RLS policies
CREATE POLICY "Users view own confirmations" ON report_confirmations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins view all confirmations" ON report_confirmations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- visit_reviews RLS policies
-- Patients/caregivers can view but not create doctor reviews
CREATE POLICY "Patients view visit reviews" ON visit_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND patient_id = auth.uid())
        OR EXISTS (SELECT 1 FROM patient_caregivers WHERE patient_id = visits.patient_id AND caregiver_id = auth.uid())
    );

CREATE POLICY "Doctors view assigned reviews" ON visit_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM visits WHERE id = visit_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor'))
    );

CREATE POLICY "Admins view all reviews" ON visit_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

----------------------------------------------------------------------------------------
-- Trigger for updated_at on tables
----------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visits
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_reports
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visit_reviews
    BEFORE UPDATE ON visit_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: patient_caregivers, messages, and report_confirmations do not have updated_at triggers
-- as they are designed as append-only or insert-only tables

----------------------------------------------------------------------------------------
-- Documentation: How to apply this migration
----------------------------------------------------------------------------------------

-- To apply this migration to a Supabase project:
-- 1. Place this file in supabase/migrations/ with a timestamp prefix (e.g., 20240101_0001_initial_schema.sql)
-- 2. Run: supabase migration apply --local migration_file.sql
--    Or use the Supabase Dashboard > SQL Editor to run the SQL
-- 3. Verify RLS policies are enabled on all tables
-- 4. Create a service-role key protected FastAPI backend that enforces authorization
-- 5. Do NOT grant universal access to authenticated users on any table

-- Important notes:
-- - profiles.id references auth.users(id) - Supabase Auth must be configured first
-- - patient_caregivers has NO insert policy - relationships require an invitation/approval flow
-- - visit_reviews with review_type 'doctor' must not be insertable by patients/caregivers
-- - report_confirmations is append-only - never perform UPDATE/DELETE from application layer
-- - All RLS policies use auth.uid() - client-supplied author IDs or roles must NOT be trusted
-- - FastAPI backend using service-role key MUST enforce authorization; RLS does not protect against service-role key bypass
-- - Status values used: pending, active, inactive (profiles); Confirmed/Reviewed/Cancelled (visits);
--   Draft/Pending/Shared/Available/Requested (reports); pending/completed (visit_reviews)
--   These must be mapped consistently to frontend/backend status enums