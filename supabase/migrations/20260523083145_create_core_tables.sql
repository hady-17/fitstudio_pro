-- =====================================================
-- FitStudio Pro - Initial Database Schema
-- =====================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =====================================================
-- profiles
-- Links app profile data to Supabase Auth users
-- =====================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  global_role text not null default 'user'
    check (global_role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- studios
-- Represents a fitness studio or trainer business
-- =====================================================
create table public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- studio_members
-- Connects users to studios with roles
-- =====================================================
create table public.studio_members (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'trainer', 'client')),
  created_at timestamptz not null default now(),

  constraint studio_members_unique_user_per_studio unique (studio_id, user_id)
);

-- =====================================================
-- clients
-- Represents client records inside a studio
-- user_id is nullable because a client may be invited later
-- =====================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  trainer_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),
  goal text,
  notes text,
  joined_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- exercises
-- Reusable exercise library
-- =====================================================
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  equipment text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

-- =====================================================
-- workout_plans
-- Workout program assigned to a client
-- =====================================================
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'active'
    check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- workout_days
-- Days inside a workout plan
-- =====================================================
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_number int not null,
  title text not null,
  notes text,

  constraint workout_days_unique_day_per_plan unique (workout_plan_id, day_number)
);

-- =====================================================
-- workout_items
-- Exercises inside a workout day
-- =====================================================
create table public.workout_items (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sets int check (sets is null or sets > 0),
  reps text,
  target_weight text,
  rest_seconds int check (rest_seconds is null or rest_seconds >= 0),
  notes text
);

-- =====================================================
-- workout_logs
-- Client workout completion logs
-- =====================================================
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  completed_at timestamptz not null default now(),
  difficulty_rating int check (difficulty_rating between 1 and 10),
  feedback text
);

-- =====================================================
-- check_ins
-- Weekly client check-ins
-- =====================================================
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  weight numeric(6,2) check (weight is null or weight > 0),
  mood int check (mood between 1 and 10),
  energy_level int check (energy_level between 1 and 10),
  sleep_hours numeric(4,2) check (sleep_hours is null or sleep_hours >= 0),
  notes text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- measurements
-- Progress body measurements
-- =====================================================
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  weight numeric(6,2) check (weight is null or weight > 0),
  waist numeric(6,2) check (waist is null or waist > 0),
  chest numeric(6,2) check (chest is null or chest > 0),
  arms numeric(6,2) check (arms is null or arms > 0),
  legs numeric(6,2) check (legs is null or legs > 0),
  created_at timestamptz not null default now()
);

-- =====================================================
-- trainer_availability
-- Trainer weekly availability
-- day_of_week: 0 = Sunday, 6 = Saturday
-- =====================================================
create table public.trainer_availability (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  constraint trainer_availability_time_valid check (end_time > start_time)
);

-- =====================================================
-- sessions
-- Scheduled trainer-client appointments
-- =====================================================
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'missed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint session_time_valid check (end_time > start_time)
);

-- =====================================================
-- subscription_plans
-- Fake/test business plans for clients
-- =====================================================
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  billing_period text not null default 'monthly'
    check (billing_period in ('weekly', 'monthly', 'quarterly', 'yearly')),
  created_at timestamptz not null default now()
);

-- =====================================================
-- client_subscriptions
-- Client subscription records
-- =====================================================
create table public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active'
    check (status in ('active', 'paused', 'cancelled')),
  started_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),

  constraint client_subscription_dates_valid check (
    ends_at is null or ends_at >= started_at
  )
);

-- =====================================================
-- payments
-- Simple fake/test payment tracking
-- =====================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'paid'
    check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================
-- notifications
-- In-app notifications
-- =====================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================
-- reminder_jobs
-- Tracks scheduled reminder tasks
-- =====================================================
create table public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'cancelled')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================
-- ai_summaries
-- Stores generated weekly summaries
-- =====================================================
create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  summary_type text not null,
  summary text not null,
  source_range_start date,
  source_range_end date,
  created_at timestamptz not null default now(),

  constraint ai_summary_range_valid check (
    source_range_start is null
    or source_range_end is null
    or source_range_end >= source_range_start
  )
);

-- =====================================================
-- audit_logs
-- Tracks important backend actions
-- =====================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  studio_id uuid references public.studios(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Indexes
-- Improves common lookup performance
-- =====================================================

create index idx_studios_owner_id
  on public.studios(owner_id);

create index idx_studio_members_studio_id
  on public.studio_members(studio_id);

create index idx_studio_members_user_id
  on public.studio_members(user_id);

create index idx_clients_studio_id
  on public.clients(studio_id);

create index idx_clients_trainer_id
  on public.clients(trainer_id);

create index idx_clients_user_id
  on public.clients(user_id);

create index idx_exercises_name
  on public.exercises(name);

create index idx_workout_plans_studio_id
  on public.workout_plans(studio_id);

create index idx_workout_plans_client_id
  on public.workout_plans(client_id);

create index idx_workout_plans_trainer_id
  on public.workout_plans(trainer_id);

create index idx_workout_days_plan_id
  on public.workout_days(workout_plan_id);

create index idx_workout_items_day_id
  on public.workout_items(workout_day_id);

create index idx_workout_items_exercise_id
  on public.workout_items(exercise_id);

create index idx_workout_logs_client_id
  on public.workout_logs(client_id);

create index idx_workout_logs_workout_day_id
  on public.workout_logs(workout_day_id);

create index idx_workout_logs_completed_at
  on public.workout_logs(completed_at desc);

create index idx_check_ins_client_created
  on public.check_ins(client_id, created_at desc);

create index idx_measurements_client_created
  on public.measurements(client_id, created_at desc);

create index idx_trainer_availability_trainer_day
  on public.trainer_availability(trainer_id, day_of_week);

create index idx_sessions_studio_id
  on public.sessions(studio_id);

create index idx_sessions_trainer_time
  on public.sessions(trainer_id, start_time, end_time);

create index idx_sessions_client_time
  on public.sessions(client_id, start_time);

create index idx_sessions_status
  on public.sessions(status);

create index idx_subscription_plans_studio_id
  on public.subscription_plans(studio_id);

create index idx_client_subscriptions_client_id
  on public.client_subscriptions(client_id);

create index idx_client_subscriptions_plan_id
  on public.client_subscriptions(plan_id);

create index idx_payments_client_id
  on public.payments(client_id);

create index idx_payments_status
  on public.payments(status);

create index idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index idx_reminder_jobs_scheduled
  on public.reminder_jobs(status, scheduled_for);

create index idx_ai_summaries_client_created
  on public.ai_summaries(client_id, created_at desc);

create index idx_audit_logs_actor_id
  on public.audit_logs(actor_id);

create index idx_audit_logs_studio_id
  on public.audit_logs(studio_id);

create index idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id);

-- =====================================================
-- updated_at helper function
-- Automatically updates updated_at columns
-- =====================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_studios_updated_at
before update on public.studios
for each row
execute function public.set_updated_at();

create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

create trigger set_workout_plans_updated_at
before update on public.workout_plans
for each row
execute function public.set_updated_at();

create trigger set_sessions_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

-- =====================================================
-- Enable Row Level Security
-- Policies will be added in a separate migration
-- =====================================================

alter table public.profiles enable row level security;
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;
alter table public.clients enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_items enable row level security;
alter table public.workout_logs enable row level security;
alter table public.check_ins enable row level security;
alter table public.measurements enable row level security;
alter table public.trainer_availability enable row level security;
alter table public.sessions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.client_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.audit_logs enable row level security;