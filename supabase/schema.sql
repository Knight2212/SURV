-- Vevox Interactive Audience Response Platform Schema
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Rooms / Sessions Table
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  pin text not null unique,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  active_poll_id uuid,
  active_survey_id uuid,
  allow_anonymous_qa boolean not null default true,
  require_participant_name boolean not null default false,
  participant_count int not null default 0,
  created_at timestamp with time zone default now()
);

-- 2. Polls Table
create table if not exists public.polls (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  type text not null check (type in ('multiple_choice', 'word_cloud', 'rating', 'numeric', 'open_text', 'quiz')),
  options jsonb default '[]'::jsonb,
  is_open boolean not null default false,
  show_results boolean not null default false,
  show_correct boolean not null default false,
  time_limit int,
  order_index int not null default 0,
  created_at timestamp with time zone default now()
);

-- 3. Poll Responses Table
create table if not exists public.poll_responses (
  id uuid primary key default uuid_generate_v4(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id text not null,
  participant_name text,
  value jsonb not null,
  created_at timestamp with time zone default now()
);

-- 4. Q&A Questions Table
create table if not exists public.qa_questions (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id text not null,
  author_name text not null default 'Anonymous',
  is_anonymous boolean not null default true,
  text text not null,
  upvotes int not null default 0,
  upvoted_by jsonb not null default '[]'::jsonb,
  is_answered boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamp with time zone default now()
);

-- 5. Surveys Table
create table if not exists public.surveys (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null default '[]'::jsonb,
  is_open boolean not null default true,
  created_at timestamp with time zone default now()
);

-- 6. Survey Responses Table
create table if not exists public.survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id text not null,
  participant_name text,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamp with time zone default now()
);

-- Indices for rapid querying
create index if not exists idx_rooms_pin on public.rooms(pin);
create index if not exists idx_polls_room on public.polls(room_id);
create index if not exists idx_responses_poll on public.poll_responses(poll_id);
create index if not exists idx_qa_room on public.qa_questions(room_id);
create index if not exists idx_surveys_room on public.surveys(room_id);

-- Enable Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.polls enable row level security;
alter table public.poll_responses enable row level security;
alter table public.qa_questions enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

-- Public Access policies for audience participation & presenters
create policy "Public read rooms" on public.rooms for select using (true);
create policy "Public write rooms" on public.rooms for all using (true);

create policy "Public read polls" on public.polls for select using (true);
create policy "Public write polls" on public.polls for all using (true);

create policy "Public read responses" on public.poll_responses for select using (true);
create policy "Public insert responses" on public.poll_responses for insert with check (true);

create policy "Public read qa" on public.qa_questions for select using (true);
create policy "Public write qa" on public.qa_questions for all using (true);

create policy "Public read surveys" on public.surveys for select using (true);
create policy "Public write surveys" on public.surveys for all using (true);

create policy "Public read survey_responses" on public.survey_responses for select using (true);
create policy "Public insert survey_responses" on public.survey_responses for insert with check (true);

-- Enable Supabase Realtime Replication on tables
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.poll_responses;
alter publication supabase_realtime add table public.qa_questions;
alter publication supabase_realtime add table public.surveys;
alter publication supabase_realtime add table public.survey_responses;
