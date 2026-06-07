# FitStudio Pro — Supabase Full-Stack Project Specification

## How to use this document

Use this Markdown file as the main project brief inside a ChatGPT Project.  
The goal is to guide development from database design to backend implementation, frontend UI, testing, integration, and deployment.

This project is designed for a fresh CS graduate who wants to become stronger in backend development while still building a complete visible product.

---

# 1. Project Summary

## Project Name

**FitStudio Pro**

## One-Line Pitch

A full-stack SaaS platform for personal trainers and small fitness studios to manage clients, workout plans, appointments, progress tracking, reminders, and business analytics.

## Main Goal

Build a production-style backend-heavy project using:

- TypeScript
- Node.js
- Express
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Next.js frontend
- Testing
- Deployment
- Clean documentation

The project should be strong enough to include on a CV and discuss in backend/full-stack interviews.

---

# 2. Target Developer Profile

This project is designed for a developer who:

- Can build databases and APIs but needs structured guidance.
- Knows TypeScript, Node.js, and Express.
- Wants backend development as the main career goal.
- Wants to learn full-stack because seeing the full product is motivating.
- Can spend around 2 hours per day.
- Is interested in health, fitness, and business products.
- May later build a Flutter mobile app as a second client.

---

# 3. Product Vision

FitStudio Pro helps personal trainers and small fitness businesses manage their operations.

Trainers can:

- Create a studio workspace.
- Add clients.
- Create workout plans.
- Assign workouts to clients.
- Track workout completion.
- Schedule sessions.
- Detect booking conflicts.
- Track client check-ins.
- View business analytics.
- Receive reminders.
- Generate weekly client summaries.

Clients can:

- View their assigned workouts.
- Log completed workouts.
- Submit weekly check-ins.
- View upcoming sessions.
- Track progress over time.

Studio owners can:

- Manage trainers and clients.
- View studio-level business analytics.
- Track revenue, active clients, completion rate, and missed check-ins.

---

# 4. Why This Project Is CV-Worthy

This project is not just CRUD.

It demonstrates:

- Relational database design
- Role-based access control
- Supabase Auth integration
- Supabase PostgreSQL usage
- SQL migrations
- Backend API architecture
- Clean Express structure
- Validation and error handling
- Scheduling and conflict detection
- Background jobs
- Analytics queries
- File uploads
- Testing
- Deployment
- Real-world SaaS thinking

Strong resume message:

> Built a production-style SaaS backend for fitness businesses with authentication, role-based permissions, scheduling, workout tracking, reminders, analytics, Supabase PostgreSQL, and a polished full-stack dashboard.

---

# 5. Final Tech Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts
- Supabase client for auth session handling

## Backend

- Node.js
- Express
- TypeScript
- Supabase JavaScript client
- Zod
- JWT/session validation through Supabase Auth
- REST API
- Service/controller/repository style structure

## Database

- Supabase PostgreSQL
- SQL migrations
- Row Level Security policies
- Database functions where useful
- Supabase-generated TypeScript types

## Storage

- Supabase Storage
- Used for profile images, progress photos, and optional document uploads

## Background Jobs

- Redis
- BullMQ
- Separate worker process

## Email

- Resend, SendGrid, or similar email API

## Testing

- Jest
- Supertest
- Integration tests against test database
- Optional Playwright for frontend E2E tests

## Deployment

- Supabase for database, auth, and storage
- Render, Railway, or Fly.io for Express API and worker
- Vercel for Next.js frontend
- Upstash Redis or Railway Redis for queues
- GitHub Actions for CI

---

# 6. Architecture Overview

## Recommended Architecture

Use Supabase as the managed database, auth provider, and storage provider.

Use Express as the main backend API layer.

The frontend should not directly perform important business writes to database tables.  
The backend should own the main business rules.

```txt
User Browser
   |
   | Next.js frontend
   |
Express API
   |
   | Supabase service client
   |
Supabase PostgreSQL
Supabase Auth
Supabase Storage
   |
Redis + BullMQ Worker
   |
Email Provider
```

## Why Use an Express Backend If Supabase Has APIs?

Because the goal is backend development.

The Express backend should handle:

- Authorization logic
- Role checks
- Business workflows
- Scheduling conflict detection
- Analytics aggregation
- Background job creation
- API validation
- Error handling
- Integration testing
- Secure use of service role key

Supabase should handle:

- Managed PostgreSQL
- Auth
- Storage
- RLS defense-in-depth
- Database migrations
- Type generation

---

# 7. Security Rules

## Important Supabase Security Rules

1. Never expose the Supabase service role key in the frontend.
2. Use the service role key only in the backend or worker.
3. Enable Row Level Security on exposed tables.
4. Use policies even if the Express backend performs authorization.
5. Keep frontend Supabase client limited to auth/session handling and safe reads if needed.
6. Validate every API input with Zod.
7. Check that users can only access their own studio/client data.
8. Never trust `userId`, `studioId`, or `role` sent from the frontend.
9. Always derive authenticated user identity from Supabase Auth token.
10. Use environment variables for all secrets.

---

# 8. User Roles

## Roles

### Studio Owner

Can:

- Create and manage studio.
- Add trainers.
- Add clients.
- View all clients in the studio.
- View all analytics.
- Manage subscription plans.
- Manage appointments.

### Trainer

Can:

- View assigned clients.
- Create workout plans for assigned clients.
- Schedule sessions.
- View client progress.
- View limited analytics.

### Client

Can:

- View own workout plan.
- Log workout completion.
- Submit check-ins.
- View own progress.
- View own sessions.

### System Admin

Optional. Can be skipped in MVP.

---

# 9. MVP Scope

## Must Build

1. Authentication
2. Studio creation
3. Roles and permissions
4. Client management
5. Workout plan creation
6. Workout logging
7. Check-ins
8. Session booking
9. Scheduling conflict detection
10. Dashboard analytics
11. Notifications table
12. Basic reminder worker
13. Frontend dashboard
14. Deployment
15. README and API docs
16. Integration tests

## Should Build If Time Allows

1. Email reminders
2. AI weekly client summary
3. Supabase Storage for progress photos
4. Client portal
5. More advanced analytics
6. Frontend E2E tests

## Skip for Version 1

1. Real payments
2. Nutrition plans
3. Wearable integration
4. Complex Flutter app
5. Video workouts
6. Chat
7. Medical recommendations
8. Real Stripe billing
9. Multi-branch gym management

---

# 10. Database Design

## Schema Strategy

Use Supabase SQL migrations.

Recommended schema:

- `public.profiles`
- `public.studios`
- `public.studio_members`
- `public.clients`
- `public.exercises`
- `public.workout_plans`
- `public.workout_days`
- `public.workout_items`
- `public.workout_logs`
- `public.check_ins`
- `public.measurements`
- `public.trainer_availability`
- `public.sessions`
- `public.subscription_plans`
- `public.client_subscriptions`
- `public.payments`
- `public.notifications`
- `public.reminder_jobs`
- `public.ai_summaries`
- `public.audit_logs`

---

# 11. Database Tables

## profiles

Stores public user profile data linked to Supabase Auth users.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  global_role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## studios

Represents a fitness studio or trainer business.

```sql
create table public.studios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## studio_members

Connects users to studios with roles.

```sql
create table public.studio_members (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'trainer', 'client')),
  created_at timestamptz not null default now(),
  unique (studio_id, user_id)
);
```

## clients

Represents client membership inside a studio.

```sql
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  trainer_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  goal text,
  notes text,
  joined_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## exercises

Reusable exercise library.

```sql
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text,
  equipment text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);
```

## workout_plans

Workout program assigned to a client.

```sql
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## workout_days

Days inside a workout plan.

```sql
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_number int not null,
  title text not null,
  notes text,
  unique (workout_plan_id, day_number)
);
```

## workout_items

Exercises inside a workout day.

```sql
create table public.workout_items (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sets int,
  reps text,
  target_weight text,
  rest_seconds int,
  notes text
);
```

## workout_logs

Client completion logs.

```sql
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  completed_at timestamptz not null default now(),
  difficulty_rating int check (difficulty_rating between 1 and 10),
  feedback text
);
```

## check_ins

Weekly client check-ins.

```sql
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  weight numeric(6,2),
  mood int check (mood between 1 and 10),
  energy_level int check (energy_level between 1 and 10),
  sleep_hours numeric(4,2),
  notes text,
  created_at timestamptz not null default now()
);
```

## measurements

Progress measurements.

```sql
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  weight numeric(6,2),
  waist numeric(6,2),
  chest numeric(6,2),
  arms numeric(6,2),
  legs numeric(6,2),
  created_at timestamptz not null default now()
);
```

## trainer_availability

Trainer weekly availability.

```sql
create table public.trainer_availability (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
```

## sessions

Scheduled appointments.

```sql
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
```

## subscription_plans

Fake/test business plans for clients.

```sql
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  billing_period text not null default 'monthly',
  created_at timestamptz not null default now()
);
```

## client_subscriptions

Client subscription records.

```sql
create table public.client_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  started_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now()
);
```

## payments

Simple fake/test payment tracking.

```sql
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'paid' check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
```

## notifications

In-app notifications.

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
```

## reminder_jobs

Tracks scheduled reminder tasks.

```sql
create table public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

## ai_summaries

Stores generated weekly summaries.

```sql
create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  summary_type text not null,
  summary text not null,
  source_range_start date,
  source_range_end date,
  created_at timestamptz not null default now()
);
```

## audit_logs

Tracks important backend actions.

```sql
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
```

---

# 12. Database Indexes

Create indexes for common queries.

```sql
create index idx_clients_studio_id on public.clients(studio_id);
create index idx_clients_trainer_id on public.clients(trainer_id);
create index idx_workout_plans_client_id on public.workout_plans(client_id);
create index idx_sessions_trainer_time on public.sessions(trainer_id, start_time, end_time);
create index idx_sessions_client_time on public.sessions(client_id, start_time);
create index idx_check_ins_client_created on public.check_ins(client_id, created_at desc);
create index idx_measurements_client_created on public.measurements(client_id, created_at desc);
create index idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index idx_reminder_jobs_scheduled on public.reminder_jobs(status, scheduled_for);
```

---

# 13. Row Level Security Plan

Even though the backend will control business logic, enable RLS for defense-in-depth.

## Enable RLS

```sql
alter table public.profiles enable row level security;
alter table public.studios enable row level security;
alter table public.studio_members enable row level security;
alter table public.clients enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_items enable row level security;
alter table public.workout_logs enable row level security;
alter table public.check_ins enable row level security;
alter table public.measurements enable row level security;
alter table public.sessions enable row level security;
alter table public.notifications enable row level security;
```

## Suggested Policy Approach

Start with simple policies:

- Users can read their own profile.
- Users can read studios where they are members.
- Studio owners can manage data in their studio.
- Trainers can read assigned clients.
- Clients can read their own data.
- Clients can insert their own workout logs and check-ins.

If most writes go through the Express backend using the service role key, keep frontend direct database writes minimal.

---

# 14. Supabase Storage Plan

## Buckets

Create these buckets:

```txt
avatars
progress-photos
documents
```

## Storage Rules

- `avatars`: user can upload/update own avatar.
- `progress-photos`: client and assigned trainer can view, client can upload own photos.
- `documents`: private by default, only studio owner/trainer can access relevant client files.

## MVP Storage Feature

Only implement avatars or progress photos.  
Do not spend too much time on file management in version 1.

---

# 15. Backend Architecture

## Folder Structure

```txt
backend/
  src/
    app.ts
    server.ts

    config/
      env.ts

    lib/
      supabase.ts
      redis.ts
      logger.ts

    middleware/
      auth.middleware.ts
      role.middleware.ts
      error.middleware.ts
      validate.middleware.ts

    modules/
      auth/
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.schema.ts

      studios/
        studios.routes.ts
        studios.controller.ts
        studios.service.ts
        studios.schema.ts

      clients/
        clients.routes.ts
        clients.controller.ts
        clients.service.ts
        clients.schema.ts

      workouts/
        workouts.routes.ts
        workouts.controller.ts
        workouts.service.ts
        workouts.schema.ts

      sessions/
        sessions.routes.ts
        sessions.controller.ts
        sessions.service.ts
        sessions.schema.ts

      checkins/
        checkins.routes.ts
        checkins.controller.ts
        checkins.service.ts
        checkins.schema.ts

      analytics/
        analytics.routes.ts
        analytics.controller.ts
        analytics.service.ts

      notifications/
        notifications.routes.ts
        notifications.controller.ts
        notifications.service.ts

      ai/
        ai.routes.ts
        ai.controller.ts
        ai.service.ts

    workers/
      reminder.worker.ts
      queues.ts

    utils/
      ApiError.ts
      asyncHandler.ts
      date.ts
```

---

# 16. Backend Environment Variables

```env
NODE_ENV=development
PORT=4000

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

REDIS_URL=

EMAIL_API_KEY=
EMAIL_FROM=

FRONTEND_URL=http://localhost:3000

AI_API_KEY=
AI_MODEL=
```

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must only exist in backend and worker environments.
- Never put service role key in Next.js public variables.
- Frontend variables should use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.

---

# 17. Backend API Design

## Auth

Supabase Auth handles register/login. The backend should verify Supabase JWTs.

```http
GET /api/auth/me
```

Returns authenticated profile and studio memberships.

## Studios

```http
POST /api/studios
GET /api/studios/:studioId
PATCH /api/studios/:studioId
GET /api/studios/:studioId/members
POST /api/studios/:studioId/trainers
```

## Clients

```http
POST /api/studios/:studioId/clients
GET /api/studios/:studioId/clients
GET /api/studios/:studioId/clients/:clientId
PATCH /api/studios/:studioId/clients/:clientId
DELETE /api/studios/:studioId/clients/:clientId
```

## Workouts

```http
GET /api/exercises
POST /api/exercises

POST /api/studios/:studioId/workout-plans
GET /api/studios/:studioId/workout-plans/:planId
PATCH /api/studios/:studioId/workout-plans/:planId

POST /api/workout-plans/:planId/days
POST /api/workout-days/:dayId/items

POST /api/clients/:clientId/workout-logs
GET /api/clients/:clientId/workout-logs
```

## Check-ins

```http
POST /api/clients/:clientId/check-ins
GET /api/clients/:clientId/check-ins
POST /api/clients/:clientId/measurements
GET /api/clients/:clientId/measurements
```

## Sessions

```http
POST /api/studios/:studioId/sessions
GET /api/studios/:studioId/sessions
GET /api/trainers/:trainerId/availability
POST /api/trainers/:trainerId/availability
PATCH /api/sessions/:sessionId/status
```

## Analytics

```http
GET /api/studios/:studioId/analytics/overview
GET /api/studios/:studioId/analytics/revenue
GET /api/studios/:studioId/analytics/workout-completion
GET /api/clients/:clientId/progress
```

## Notifications

```http
GET /api/notifications
PATCH /api/notifications/:notificationId/read
```

## AI

```http
POST /api/clients/:clientId/ai/weekly-summary
GET /api/clients/:clientId/ai/summaries
```

---

# 18. Backend Implementation Rules

## Use This Request Flow

Each route should follow this structure:

1. Authenticate request.
2. Validate input with Zod.
3. Check studio membership and role.
4. Call service function.
5. Service performs business logic.
6. Repository/Supabase call reads or writes data.
7. Return normalized response.
8. Log important action in audit log.

## Example Service Rules

### Create Session

Validation:

- User must be studio owner or trainer.
- Client must belong to the same studio.
- Trainer must belong to the same studio.
- Session cannot be in the past.
- End time must be after start time.
- Trainer must be available.
- Trainer must not have overlapping session.
- Client must not have overlapping session.

### Create Workout Plan

Validation:

- User must be studio owner or assigned trainer.
- Client must belong to the studio.
- Workout plan must have title.
- Workout days must have valid exercise IDs.

### Submit Check-in

Validation:

- User must be the client, assigned trainer, or studio owner.
- Mood and energy must be between 1 and 10.
- Weight must be positive if provided.

---

# 19. Scheduling Conflict Detection

When creating a session, use this logic:

```sql
select *
from public.sessions
where trainer_id = :trainer_id
  and status = 'scheduled'
  and start_time < :new_end_time
  and end_time > :new_start_time;
```

If this returns rows, the trainer is unavailable.

Also check client overlap:

```sql
select *
from public.sessions
where client_id = :client_id
  and status = 'scheduled'
  and start_time < :new_end_time
  and end_time > :new_start_time;
```

---

# 20. Analytics Requirements

## Studio Overview Analytics

Return:

- Active clients count
- Sessions this week
- Completed sessions this month
- Missed sessions this month
- Monthly revenue
- Workout completion rate
- Missed check-ins count
- New clients this month

## Client Progress Analytics

Return:

- Latest weight
- Weight trend
- Workout completion percentage
- Check-in consistency
- Last 5 check-ins
- Measurement chart data
- Upcoming sessions

---

# 21. Background Jobs

## Use BullMQ

Queues:

```txt
reminders
weekly-summaries
emails
```

## Reminder Types

1. Upcoming session reminder
2. Missed check-in reminder
3. Weekly client summary reminder
4. Inactive client reminder

## Worker Responsibilities

The worker should:

- Fetch pending reminder jobs.
- Create notification records.
- Send email if enabled.
- Update job status to sent or failed.
- Retry failed jobs safely.

---

# 22. AI Feature

## Feature Name

**Weekly Client Summary**

## Purpose

Help trainers quickly understand a client’s weekly progress.

## Inputs

- Workout logs from the last 7 days
- Check-ins from the last 7 days
- Measurements from the last 7 days
- Missed sessions
- Upcoming sessions

## Output

A short summary like:

```txt
This week, the client completed 3 of 4 assigned workouts and submitted 1 check-in.
Weight changed from 82.4kg to 81.9kg.
Energy scores were slightly lower than last week.
Suggested trainer note: ask about recovery and consider reducing lower-body intensity next week.
```

## Rules

- Do not provide medical advice.
- Do not diagnose.
- Do not promise health outcomes.
- Show summary as a trainer assistant, not a doctor.
- Store the generated summary in `ai_summaries`.

---

# 23. Frontend Architecture

## App Structure

```txt
frontend/
  app/
    login/
    register/
    dashboard/
    studios/
      [studioId]/
        page.tsx
        clients/
        clients/[clientId]/
        workouts/
        sessions/
        analytics/
        settings/

  components/
    layout/
    forms/
    charts/
    tables/
    ui/

  lib/
    supabase-client.ts
    api-client.ts
    auth.ts

  hooks/
    useCurrentUser.ts
    useStudio.ts
    useClients.ts
```

## Frontend Pages

### Public Pages

- Landing page
- Login
- Register

### Dashboard Pages

- Studio dashboard
- Clients list
- Client detail
- Workout plan builder
- Session calendar/list
- Check-ins
- Analytics
- Notifications
- Settings

---

# 24. Frontend Design Requirements

Use a clean SaaS dashboard style.

## Dashboard Cards

- Active clients
- Sessions this week
- Workout completion
- Monthly revenue
- Missed check-ins

## Client Detail Page

Show:

- Client info
- Goal
- Assigned trainer
- Current workout plan
- Recent check-ins
- Progress chart
- Upcoming sessions
- AI weekly summary

## Workout Builder

Simple but polished:

- Plan title
- Add workout day
- Add exercise
- Sets/reps/rest
- Notes

## Session Page

Show:

- Upcoming sessions
- Completed sessions
- Missed sessions
- Create session modal
- Conflict error message

---

# 25. Frontend Integration Strategy

The frontend should call the Express API for business operations.

Use Supabase client mainly for:

- Sign up
- Login
- Logout
- Session refresh
- Getting access token

For API calls:

1. Get Supabase access token.
2. Send token to Express API in Authorization header.

```txt
Authorization: Bearer <supabase_access_token>
```

Backend validates token using Supabase.

---

# 26. Testing Plan

## Backend Unit Tests

Test service logic:

- Session conflict detection
- Role permissions
- Workout plan validation
- Analytics calculations

## Backend Integration Tests

Test API endpoints:

1. Register/login test user
2. Create studio
3. Add client
4. Create workout plan
5. Log workout
6. Create session
7. Reject overlapping session
8. Submit check-in
9. Get analytics

## Frontend Tests

Start small:

- Login page renders
- Dashboard page loads
- Client list renders
- Create client form validates required fields

## E2E Test

Use Playwright if time allows:

1. User logs in.
2. Creates studio.
3. Adds client.
4. Creates workout plan.
5. Books session.
6. Sees dashboard update.

---

# 27. GitHub Actions CI

Run on every pull request:

```txt
- install dependencies
- run lint
- run typecheck
- run backend tests
- run frontend build
```

Optional:

```txt
- generate Supabase database types
- run migration check
```

---

# 28. Deployment Plan

## Supabase

Use Supabase for:

- PostgreSQL database
- Auth
- Storage
- SQL migrations
- Type generation

Set up:

1. Create Supabase project.
2. Configure auth redirect URLs.
3. Run SQL migrations.
4. Create storage buckets.
5. Enable RLS.
6. Add policies.
7. Generate database types.

## Backend API

Deploy to:

- Render
- Railway
- Fly.io

Requirements:

- Node.js runtime
- Environment variables
- Supabase URL
- Supabase service role key
- Redis URL
- Email API key

## Worker

Deploy as separate service:

```txt
npm run worker
```

The worker must have:

- Supabase service role key
- Redis URL
- Email API key

## Frontend

Deploy to Vercel.

Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

## Redis

Use:

- Upstash Redis
- Railway Redis
- Render Redis

---

# 29. Development Phases

## Phase 1 — Database First

Goal: Define the database and run migrations.

Tasks:

1. Create Supabase project.
2. Initialize Supabase CLI locally.
3. Create migration files.
4. Add all MVP tables.
5. Add indexes.
6. Enable RLS.
7. Add basic policies.
8. Seed sample exercises.
9. Generate TypeScript database types.
10. Commit migration files.

Deliverable:

- Supabase database ready.
- Tables visible in Supabase dashboard.
- Types generated.

---

## Phase 2 — Backend Foundation

Goal: Create professional Express API.

Tasks:

1. Set up Express + TypeScript.
2. Add environment validation.
3. Add Supabase admin client.
4. Add auth middleware.
5. Add error handler.
6. Add Zod validation middleware.
7. Add request logging.
8. Create `/health` endpoint.
9. Add API route structure.
10. Add test setup.

Deliverable:

- API server runs locally.
- Backend can verify Supabase user tokens.
- Backend can access database securely.

---

## Phase 3 — Auth and Studio Module

Goal: Users can create and access studios.

Tasks:

1. Implement profile creation after signup.
2. Implement `/api/auth/me`.
3. Implement create studio.
4. Implement studio membership creation.
5. Implement get current user studios.
6. Add role guard middleware.
7. Add tests for unauthorized access.

Deliverable:

- User signs up, creates studio, becomes owner.

---

## Phase 4 — Client Management Module

Goal: Trainer/studio owner can manage clients.

Tasks:

1. Create client.
2. List clients by studio.
3. View client detail.
4. Update client.
5. Assign trainer.
6. Enforce studio ownership/membership.
7. Add integration tests.

Deliverable:

- Studio has manageable clients with secure access.

---

## Phase 5 — Workout Module

Goal: Trainers can create and assign workout plans.

Tasks:

1. Seed exercise library.
2. Create workout plan.
3. Add workout days.
4. Add workout items.
5. Assign plan to client.
6. Client logs completed workout.
7. Trainer views completion history.
8. Add tests.

Deliverable:

- End-to-end workout plan workflow works.

---

## Phase 6 — Sessions and Booking

Goal: Implement appointment scheduling.

Tasks:

1. Add trainer availability.
2. Create session endpoint.
3. Add conflict detection.
4. Update session status.
5. List upcoming sessions.
6. Add tests for overlapping sessions.
7. Add dashboard counts.

Deliverable:

- Scheduling works with proper conflict prevention.

---

## Phase 7 — Check-ins and Progress

Goal: Track client progress.

Tasks:

1. Submit check-in.
2. Submit measurements.
3. Get check-in history.
4. Get measurement chart data.
5. Calculate progress trends.
6. Add tests.

Deliverable:

- Client progress can be tracked and visualized.

---

## Phase 8 — Analytics

Goal: Add business dashboard.

Tasks:

1. Active clients count.
2. Sessions this week.
3. Monthly revenue.
4. Workout completion rate.
5. Missed check-ins.
6. Client retention basics.
7. Analytics API tests.

Deliverable:

- Studio owner sees useful business overview.

---

## Phase 9 — Background Jobs

Goal: Add production-style automation.

Tasks:

1. Add Redis connection.
2. Add BullMQ queues.
3. Add reminder worker.
4. Create reminder jobs for sessions.
5. Create notification records.
6. Send email reminders.
7. Add worker tests where possible.

Deliverable:

- Reminder system works separately from API.

---

## Phase 10 — AI Weekly Summary

Goal: Add one controlled AI feature.

Tasks:

1. Create AI service.
2. Fetch weekly client activity.
3. Generate safe trainer summary.
4. Store summary.
5. Display summary in client page.
6. Add fallback if AI fails.

Deliverable:

- Trainer can generate useful weekly client summary.

---

## Phase 11 — Frontend MVP

Goal: Build the visible product.

Tasks:

1. Landing page.
2. Login/register.
3. Dashboard layout.
4. Studio dashboard.
5. Client list.
6. Client detail.
7. Workout builder.
8. Sessions page.
9. Analytics page.
10. Notifications page.

Deliverable:

- Product is demo-ready.

---

## Phase 12 — Testing, Polish, and Deployment

Goal: Make project portfolio-ready.

Tasks:

1. Run backend tests.
2. Add missing integration tests.
3. Add frontend build checks.
4. Fix TypeScript errors.
5. Add seed demo data.
6. Deploy Supabase.
7. Deploy backend.
8. Deploy worker.
9. Deploy frontend.
10. Record demo video.
11. Write final README.

Deliverable:

- Live deployed project.
- GitHub repository ready.
- CV bullets ready.
- Demo video ready.

---

# 30. 8-Week Plan for 2 Hours Per Day

## Week 1 — Supabase Database

Focus:

- Supabase setup
- SQL migrations
- Tables
- Indexes
- RLS
- Seed exercises

Output:

- Database schema completed.
- Supabase types generated.

## Week 2 — Backend Foundation and Auth

Focus:

- Express TypeScript setup
- Supabase client setup
- Auth middleware
- Error handling
- Zod validation
- `/api/auth/me`

Output:

- Secure backend foundation.

## Week 3 — Studio and Clients

Focus:

- Studio creation
- Membership roles
- Client CRUD
- Trainer assignment
- Access control tests

Output:

- Core business management works.

## Week 4 — Workouts

Focus:

- Exercises
- Workout plans
- Workout days
- Workout items
- Workout logs

Output:

- Trainer can assign workouts and client can complete them.

## Week 5 — Sessions and Check-ins

Focus:

- Availability
- Session booking
- Conflict detection
- Check-ins
- Measurements

Output:

- Scheduling and progress tracking work.

## Week 6 — Analytics and Reminders

Focus:

- Dashboard analytics
- Notifications
- BullMQ
- Redis
- Reminder worker

Output:

- Backend feels production-style.

## Week 7 — Frontend Dashboard

Focus:

- Next.js dashboard
- Clients page
- Client detail
- Workout builder
- Sessions page
- Analytics page

Output:

- Full product is visible.

## Week 8 — Testing, Deployment, README

Focus:

- Integration tests
- UI polish
- Deploy backend
- Deploy worker
- Deploy frontend
- Record demo
- Write README

Output:

- Portfolio-ready project.

---

# 31. Definition of Done

The project is done when:

- Users can register and log in.
- User can create a studio.
- Studio owner can add clients.
- Trainer can create workout plans.
- Client can log workouts.
- Trainer can schedule sessions.
- Overlapping sessions are rejected.
- Clients can submit check-ins.
- Dashboard shows analytics.
- Reminder worker creates notifications.
- Project is deployed.
- README is complete.
- At least 5 backend integration tests pass.
- Demo data exists.
- Demo video can show the full workflow.

---

# 32. Demo Flow

Use this flow for the final demo video:

1. Open landing page.
2. Register/login.
3. Create a studio.
4. Add a trainer or use owner as trainer.
5. Add a client.
6. Create workout plan.
7. Add workout days and exercises.
8. Log a completed workout as client.
9. Submit a weekly check-in.
10. Book a session.
11. Try booking overlapping session and show rejection.
12. View analytics dashboard.
13. Generate AI weekly summary.
14. Show notification/reminder.
15. Show deployed app and GitHub README.

---

# 33. README Template

```md
# FitStudio Pro

## Overview

FitStudio Pro is a full-stack SaaS platform for personal trainers and small fitness studios to manage clients, workout plans, appointments, progress tracking, reminders, and analytics.

## Live Demo

- Frontend:
- Backend API:
- Demo Video:

## Demo Accounts

- Studio Owner:
- Trainer:
- Client:

## Features

- Supabase Auth
- Studio workspaces
- Role-based access control
- Client management
- Workout plan builder
- Workout completion tracking
- Session booking
- Conflict detection
- Check-ins and measurements
- Business analytics
- Background reminders
- AI weekly summaries
- Supabase Storage
- Integration tests

## Tech Stack

- Next.js
- TypeScript
- Node.js
- Express
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Redis
- BullMQ
- Jest
- Supertest
- Vercel
- Render/Railway

## Architecture

Include architecture diagram here.

## Database Schema

Explain main tables and relationships.

## API Documentation

List main API endpoints.

## Role-Based Access Control

Explain owner, trainer, and client permissions.

## Scheduling Conflict Detection

Explain overlap logic.

## Background Jobs

Explain reminder worker and queues.

## AI Weekly Summary

Explain AI feature and safety limits.

## Testing

Explain how to run tests.

## Local Setup

Explain environment variables and commands.

## Deployment

Explain Supabase, backend, worker, and frontend deployment.

## Known Limitations

- No real payment processing.
- No medical advice.
- No Flutter app in MVP.
- AI summaries require trainer review.

## Future Improvements

- Flutter mobile client.
- Stripe test integration.
- Client progress photos.
- Trainer-client messaging.
- Calendar integration.
```

---

# 34. Resume Bullets

Use these after completing the project:

- Built **FitStudio Pro**, a full-stack SaaS platform for fitness trainers to manage clients, workout plans, appointments, progress tracking, reminders, and business analytics.
- Designed a backend-focused architecture using **Node.js, Express, TypeScript, Supabase PostgreSQL, Supabase Auth, and Supabase Storage**.
- Implemented role-based access control for studio owners, trainers, and clients with secure API authorization and Supabase Row Level Security.
- Built appointment scheduling with conflict detection, workout completion tracking, client check-ins, analytics dashboards, and background reminders using **Redis and BullMQ**.
- Added backend integration tests with **Jest and Supertest**, deployed the frontend, API, worker, and Supabase database, and documented the system with API examples and architecture diagrams.

---

# 35. Best First Task

Start with the database.

Do this first:

1. Create Supabase project.
2. Install Supabase CLI.
3. Initialize local Supabase project.
4. Create first migration.
5. Add `profiles`, `studios`, and `studio_members`.
6. Enable RLS.
7. Test signup/login.
8. Generate TypeScript database types.

Do not start the frontend before the database and backend foundation are working.

---

# 36. Guidance for ChatGPT While Working on This Project

When helping build this project, ChatGPT should:

1. Work step by step.
2. Start from the database and backend before frontend.
3. Prefer simple, working code over overengineering.
4. Explain folder structure and file purpose.
5. Give complete code for each file when requested.
6. Keep the developer’s skill level in mind.
7. Use TypeScript best practices.
8. Include error handling.
9. Include Zod validation.
10. Include tests for important backend logic.
11. Avoid adding unnecessary features before MVP is done.
12. Warn when a feature increases scope too much.
13. Keep Supabase service role key backend-only.
14. Use RLS as defense-in-depth.
15. Prioritize deployable, portfolio-ready code.

---

# 37. Final Project Principle

The goal is not to build the biggest app.

The goal is to build a clean, finished, professional project that proves:

- I can design a database.
- I can build secure APIs.
- I can use Supabase properly.
- I can implement real business logic.
- I can test my backend.
- I can deploy a full-stack application.
- I can explain my technical decisions in interviews.
