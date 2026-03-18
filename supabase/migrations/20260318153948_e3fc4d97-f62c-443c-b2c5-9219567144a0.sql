-- Role enum
CREATE TYPE public.app_role AS ENUM ('candidate', 'recruiter');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'candidate',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  resume_url TEXT,
  resume_parsed JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner and recruiters"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Software Engineer',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  mode TEXT NOT NULL DEFAULT 'text',
  language TEXT NOT NULL DEFAULT 'English',
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_questions INT NOT NULL DEFAULT 5,
  current_question INT NOT NULL DEFAULT 0,
  communication_score NUMERIC,
  technical_score NUMERIC,
  confidence_score NUMERIC,
  resume_match_score NUMERIC,
  overall_score NUMERIC,
  ai_feedback TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews"
  ON public.interviews FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'recruiter'));

CREATE POLICY "Users can create interviews"
  ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON public.interviews FOR UPDATE USING (auth.uid() = user_id);

-- Interview Questions
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  time_taken_seconds INT,
  score NUMERIC,
  ai_feedback TEXT,
  filler_words_count INT DEFAULT 0,
  hesitation_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions"
  ON public.interview_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews i
      WHERE i.id = interview_id AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'recruiter'))
    )
  );

CREATE POLICY "Users can insert questions for own interviews"
  ON public.interview_questions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.user_id = auth.uid())
  );

CREATE POLICY "Users can update questions for own interviews"
  ON public.interview_questions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.user_id = auth.uid())
  );

-- Shortlisted candidates (recruiter feature)
CREATE TABLE public.shortlisted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id, interview_id)
);
ALTER TABLE public.shortlisted ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage shortlist"
  ON public.shortlisted FOR ALL
  USING (public.has_role(auth.uid(), 'recruiter'));

-- Resume storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

CREATE POLICY "Users can upload own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own resume"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'recruiter')));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'candidate'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
