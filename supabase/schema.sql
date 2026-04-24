-- =====================================================
-- VoteSnap Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  age_range   TEXT,
  gender      TEXT,
  interests   TEXT[] DEFAULT '{}',
  is_pro      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_text    TEXT NOT NULL,
  option_a         TEXT NOT NULL DEFAULT 'Yes',
  option_b         TEXT NOT NULL DEFAULT 'No',
  category         TEXT,
  duration_minutes INT NOT NULL DEFAULT 10,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id  UUID REFERENCES questions ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vote         TEXT NOT NULL CHECK (vote IN ('A', 'B')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (question_id, user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questions_status     ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_expires_at ON questions(expires_at);
CREATE INDEX IF NOT EXISTS idx_questions_user_id    ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_question_id    ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id        ON votes(user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes     ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profile_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Questions: owner sees all theirs; others see only active+unexpired
CREATE POLICY "question_select" ON questions FOR SELECT USING (
  user_id = auth.uid()
  OR (status = 'active' AND expires_at > NOW())
);
CREATE POLICY "question_insert_own" ON questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "question_update_own" ON questions FOR UPDATE USING (auth.uid() = user_id);

-- Votes: authenticated users can read all (for result display); can only insert own
CREATE POLICY "vote_select_auth"  ON votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "vote_insert_own"   ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: auto-create profile on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: auto-expire questions (optional cron)
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_questions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE questions
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();
END;
$$;

-- =====================================================
-- Supabase Google OAuth Setup (Supabase Dashboard):
--   Authentication → Providers → Google → Enable
--   Redirect URL: https://your-project.supabase.co/auth/v1/callback
--   Site URL: https://votesnap.online
--   Additional redirect URLs: http://localhost:3000/auth/callback
-- =====================================================
