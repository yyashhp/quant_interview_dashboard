-- ============================================================
-- QuantPrep Database Schema
-- Run this in the Supabase SQL editor to initialize the DB
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES
-- ============================================================
create table public.companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  description text,
  is_premium  boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TOPICS
-- ============================================================
create table public.topics (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id  text unique,
  stripe_customer_id      text,
  plan                    text not null check (plan in ('week', 'month', 'three_month')),
  status                  text not null check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end      timestamptz not null,
  created_at              timestamptz not null default now()
);

-- ============================================================
-- QUESTIONS
-- ============================================================
create table public.questions (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  content      text not null,
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard')),
  round_tag    text not null check (round_tag in ('online_assessment', 'first_round', 'second_round', 'final_round')),
  is_free      boolean not null default false,
  source_notes text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at
  before update on public.questions
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ANSWERS (paywalled — protected by RLS)
-- ============================================================
create table public.answers (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null unique references public.questions(id) on delete cascade,
  content     text not null,
  explanation text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger answers_updated_at
  before update on public.answers
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- JUNCTION TABLES
-- ============================================================
create table public.question_topics (
  question_id uuid not null references public.questions(id) on delete cascade,
  topic_id    uuid not null references public.topics(id) on delete cascade,
  primary key (question_id, topic_id)
);

create table public.question_companies (
  question_id uuid not null references public.questions(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  primary key (question_id, company_id)
);

-- ============================================================
-- USER PROGRESS
-- ============================================================
create table public.user_progress (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  is_bookmarked boolean not null default false,
  is_completed  boolean not null default false,
  created_at    timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.questions (difficulty);
create index on public.questions (round_tag);
create index on public.questions (is_free);
create index on public.question_topics (topic_id);
create index on public.question_companies (company_id);
create index on public.subscriptions (user_id);
create index on public.subscriptions (stripe_customer_id);
create index on public.user_progress (user_id);

-- Full-text search index
alter table public.questions add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored;
create index on public.questions using gin(search_vector);

-- ============================================================
-- HELPER FUNCTION: check if user has active subscription
-- ============================================================
create or replace function public.user_has_active_subscription(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid
      and status = 'active'
      and current_period_end > now()
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- profiles: users can read any profile, only edit their own
alter table public.profiles enable row level security;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- companies: public read; only admins write
alter table public.companies enable row level security;
create policy "Companies are publicly readable" on public.companies for select using (true);
create policy "Admins can manage companies" on public.companies for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- topics: public read; only admins write
alter table public.topics enable row level security;
create policy "Topics are publicly readable" on public.topics for select using (true);
create policy "Admins can manage topics" on public.topics for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- questions: public read; only admins write
alter table public.questions enable row level security;
create policy "Questions are publicly readable" on public.questions for select using (true);
create policy "Admins can manage questions" on public.questions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- answers: CRITICAL PAYWALL — only active subscribers and admins can read
alter table public.answers enable row level security;
create policy "Answers visible to active subscribers and admins" on public.answers for select
  using (
    public.user_has_active_subscription(auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Admins can manage answers" on public.answers for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- question_topics: public read; admins write
alter table public.question_topics enable row level security;
create policy "Question topics are publicly readable" on public.question_topics for select using (true);
create policy "Admins can manage question_topics" on public.question_topics for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- question_companies: PAYWALL for company association reads
alter table public.question_companies enable row level security;
create policy "Question companies visible to subscribers and admins" on public.question_companies for select
  using (
    public.user_has_active_subscription(auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Admins can manage question_companies" on public.question_companies for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- subscriptions: users can only see their own
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service role manages subscriptions" on public.subscriptions for all using (true);

-- user_progress: users can only see and manage their own
alter table public.user_progress enable row level security;
create policy "Users manage own progress" on public.user_progress for all using (auth.uid() = user_id);
