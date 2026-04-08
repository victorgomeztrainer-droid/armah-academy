-- ══════════════════════════════════════════════════════════════════
-- ARMAH ACADEMY — Schema Migration V2
-- 1. Add exercise_details table
-- 2. Migrate quizzes from per-module → per-program
-- RUN THIS BEFORE supabase-seed-core-v3.sql
-- ══════════════════════════════════════════════════════════════════

-- ── Step 1: Clean all quiz-related data (we will re-seed) ─────────
delete from public.quiz_attempts;
delete from public.quiz_options where question_id in (select id from public.quiz_questions);
delete from public.quiz_questions;
delete from public.quizzes;

-- ── Step 2: Migrate quizzes table ─────────────────────────────────
do $$
begin
  -- Drop module_id column if it exists
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quizzes' and column_name = 'module_id'
  ) then
    alter table public.quizzes drop column module_id cascade;
  end if;

  -- Add program_id column if not already there
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quizzes' and column_name = 'program_id'
  ) then
    alter table public.quizzes
      add column program_id uuid references public.programs(id) on delete cascade not null default gen_random_uuid();
    -- Now remove the bogus default; the NOT NULL is fine because there are 0 rows
    alter table public.quizzes alter column program_id drop default;
  end if;

  -- Add unique constraint on program_id (one quiz per program)
  if not exists (
    select 1 from pg_constraint
    where conname = 'quizzes_program_id_key' and conrelid = 'public.quizzes'::regclass
  ) then
    alter table public.quizzes add constraint quizzes_program_id_key unique (program_id);
  end if;
end $$;

-- ── Step 3: Create exercise_details table ─────────────────────────
create table if not exists public.exercise_details (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  exercise_name text not null,
  image_url text,
  coaching_cues text,
  duration_seconds integer default 45,
  rest_seconds integer default 15,
  reps integer,
  sort_order integer not null
);

-- Enable RLS
alter table public.exercise_details enable row level security;

-- Policies (skip if already exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'exercise_details' and policyname = 'Approved read exercise_details'
  ) then
    create policy "Approved read exercise_details" on public.exercise_details
      for select using (
        exists (select 1 from public.profiles where id = auth.uid() and is_approved = true)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'exercise_details' and policyname = 'Admins manage exercise_details'
  ) then
    create policy "Admins manage exercise_details" on public.exercise_details
      for all using (public.is_admin());
  end if;
end $$;
