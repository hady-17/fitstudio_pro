# FitStudio Pro - MVP/MVC Starter Plan and Scale Roadmap

## 1. Purpose

This document defines the first clean, maintainable version of FitStudio Pro and explains how to scale it gradually into the full final product.

The goal is not to build everything at once. The goal is to start with a small but professional backend-first MVP, using a structure that can grow without becoming messy.

This plan is based on the main FitStudio Pro project brief.

---

## 2. Product Direction

FitStudio Pro is a full-stack SaaS platform for personal trainers and small fitness studios.

The final product should allow trainers and studio owners to:

- Manage studios
- Manage trainers and clients
- Create workout plans
- Assign workouts
- Track workout completion
- Schedule sessions
- Detect booking conflicts
- Collect weekly check-ins
- View analytics
- Send reminders
- Generate weekly client summaries

For the first version, we will build only the core workflow needed to prove the product works.

---

## 3. Recommended Strategy

Build the project in layers:

1. Database foundation
2. Backend API foundation
3. Authentication and roles
4. Studio and client management
5. Workout management
6. Session scheduling
7. Check-ins and progress
8. Analytics
9. Frontend dashboard
10. Background jobs, AI, storage, and polish

Do not start with the frontend. The database and backend business rules should come first.

---

## 4. Architecture Principle

Use a backend-owned business logic architecture.

```txt
Browser / Next.js Frontend
        |
        | Authorization: Bearer Supabase access token
        v
Express API Backend
        |
        | Supabase service role client
        v
Supabase PostgreSQL / Auth / Storage
        |
        v
Redis + BullMQ Worker
        |
        v
Email Provider / AI Provider
```

The frontend should not directly perform important business writes to database tables.

The backend should own:

- Authentication verification
- Role checks
- Studio membership checks
- Input validation
- Scheduling conflict detection
- Analytics aggregation
- Reminder job creation
- Audit logging
- Error handling

Supabase should provide:

- PostgreSQL database
- Auth
- Storage
- SQL migrations
- Row Level Security
- Type generation

---

## 5. MVP Scope

### Build in MVP Version 1

The first version should include:

1. User authentication
2. Profile creation
3. Studio creation
4. Studio roles
5. Client management
6. Workout plan creation
7. Workout logging
8. Session booking
9. Scheduling conflict detection
10. Check-ins
11. Basic analytics
12. Basic frontend dashboard
13. Backend integration tests
14. Deployment-ready setup
15. README documentation

### Do Not Build in MVP Version 1

Move these features to later versions:

- Real payments
- Stripe billing
- Flutter app
- Chat
- Wearable integrations
- Nutrition plans
- Video workouts
- Complex AI coaching
- Multi-branch gym management
- Advanced file/document management

---

## 6. MVC + Service Layer Architecture

For maintainability, use a practical MVC-style backend with a service layer.

Classic MVC alone is often not enough for a real backend. The better structure is:

```txt
Route -> Middleware -> Controller -> Service -> Repository/Database -> Response
```

### Routes

Routes define API paths and attach middleware.

Example:

```txt
POST /api/studios/:studioId/clients
```

The route should not contain business logic.

### Controllers

Controllers handle HTTP-specific work:

- Read params
- Read request body
- Read authenticated user
- Call the correct service
- Return response

Controllers should stay thin.

### Services

Services contain business logic:

- Permission checks
- Client belongs to studio checks
- Trainer assignment rules
- Scheduling conflict detection
- Analytics calculations
- Reminder creation

Services are the most important layer.

### Repositories

Repositories or database helpers contain database queries.

For a smaller MVP, you can call Supabase directly inside services.

As the project grows, move repeated database logic into repository files.

### Middleware

Middleware handles cross-cutting concerns:

- Auth verification
- Zod validation
- Error handling
- Request logging
- Rate limiting later

---

## 7. Scalable Monorepo Structure

Recommended repository structure:

```txt
fitstudio-pro/
  README.md
  .gitignore
  .env.example

  backend/
    package.json
    tsconfig.json
    jest.config.ts
    src/
      app.ts
      server.ts

      config/
        env.ts

      lib/
        supabase.ts
        logger.ts
        redis.ts

      middleware/
        auth.middleware.ts
        validate.middleware.ts
        error.middleware.ts
        role.middleware.ts

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

      workers/
        queues.ts
        reminder.worker.ts

      utils/
        ApiError.ts
        asyncHandler.ts
        date.ts

      types/
        database.types.ts
        express.d.ts

    tests/
      integration/
      unit/

  frontend/
    package.json
    next.config.ts
    tsconfig.json
    app/
      login/
      register/
      dashboard/
      studios/
        [studioId]/
          page.tsx
          clients/
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

    hooks/
      useCurrentUser.ts
      useStudio.ts
      useClients.ts

    lib/
      api-client.ts
      supabase-client.ts
      auth.ts

  supabase/
    migrations/
    seed.sql
```

---

## 8. Backend Module Template

Every backend module should follow the same structure.

Example module:

```txt
modules/clients/
  clients.routes.ts
  clients.controller.ts
  clients.service.ts
  clients.schema.ts
```

### clients.routes.ts

Responsible for:

- Defining endpoint paths
- Adding auth middleware
- Adding validation middleware
- Connecting route to controller

### clients.controller.ts

Responsible for:

- Reading request data
- Calling service methods
- Sending HTTP responses

### clients.service.ts

Responsible for:

- Business logic
- Authorization checks
- Calling Supabase queries
- Throwing clean ApiError errors

### clients.schema.ts

Responsible for:

- Zod request body validation
- Zod query validation
- Zod route param validation if needed

---

## 9. Database Build Order

Do not create every table immediately if it slows you down.

Use this order.

### Database Milestone 1 - Identity and Studios

Create:

- profiles
- studios
- studio_members

Purpose:

- Users can exist
- Users can create studios
- Users can have roles inside studios

### Database Milestone 2 - Clients

Create:

- clients

Purpose:

- Studio owners and trainers can manage clients

### Database Milestone 3 - Workouts

Create:

- exercises
- workout_plans
- workout_days
- workout_items
- workout_logs

Purpose:

- Trainers can create workout plans
- Clients can log completed workouts

### Database Milestone 4 - Sessions

Create:

- trainer_availability
- sessions

Purpose:

- Trainers can schedule appointments
- Backend can reject overlapping sessions

### Database Milestone 5 - Check-ins and Progress

Create:

- check_ins
- measurements

Purpose:

- Clients can submit progress data
- Trainers can view trends

### Database Milestone 6 - Analytics and Notifications

Create:

- notifications
- reminder_jobs
- audit_logs

Purpose:

- Dashboard analytics
- Reminder system
- Important action tracking

### Database Milestone 7 - Later Scale Features

Create later:

- subscription_plans
- client_subscriptions
- payments
- ai_summaries

Purpose:

- Business analytics
- AI weekly summary
- Optional fake revenue tracking

---

## 10. API Design Conventions

Use REST endpoints with clear resource names.

### Auth

```http
GET /api/auth/me
```

### Studios

```http
POST /api/studios
GET /api/studios/:studioId
PATCH /api/studios/:studioId
GET /api/studios/:studioId/members
```

### Clients

```http
POST /api/studios/:studioId/clients
GET /api/studios/:studioId/clients
GET /api/studios/:studioId/clients/:clientId
PATCH /api/studios/:studioId/clients/:clientId
DELETE /api/studios/:studioId/clients/:clientId
```

### Workouts

```http
GET /api/exercises
POST /api/studios/:studioId/workout-plans
GET /api/studios/:studioId/workout-plans/:planId
POST /api/workout-plans/:planId/days
POST /api/workout-days/:dayId/items
POST /api/clients/:clientId/workout-logs
```

### Sessions

```http
POST /api/studios/:studioId/sessions
GET /api/studios/:studioId/sessions
PATCH /api/sessions/:sessionId/status
```

### Check-ins

```http
POST /api/clients/:clientId/check-ins
GET /api/clients/:clientId/check-ins
POST /api/clients/:clientId/measurements
GET /api/clients/:clientId/measurements
```

### Analytics

```http
GET /api/studios/:studioId/analytics/overview
GET /api/clients/:clientId/progress
```

---

## 11. Request Flow Standard

Every protected request should follow this flow:

```txt
1. Receive request
2. Verify Supabase access token
3. Attach user to req.user
4. Validate body, params, and query with Zod
5. Check studio membership
6. Check role permission
7. Call service method
8. Perform business logic
9. Read or write database
10. Write audit log when important
11. Return normalized response
12. Let error middleware handle failures
```

This keeps the backend secure and predictable.

---

## 12. Authorization Rules

Never trust these values from the frontend:

- userId
- studioId ownership
- role
- trainer permissions
- client ownership

Always derive the authenticated user from the Supabase access token.

### Studio Owner

Can:

- Manage studio
- Manage trainers
- Manage clients
- View all analytics
- Manage sessions

### Trainer

Can:

- View assigned clients
- Create workout plans for assigned clients
- Schedule sessions
- View limited analytics

### Client

Can:

- View own workouts
- Log own workouts
- Submit own check-ins
- View own sessions

---

## 13. Scheduling Conflict Rule

When creating a session, reject overlaps for both trainer and client.

Conflict condition:

```sql
start_time < new_end_time
and end_time > new_start_time
```

Trainer conflict query:

```sql
select *
from public.sessions
where trainer_id = :trainer_id
  and status = 'scheduled'
  and start_time < :new_end_time
  and end_time > :new_start_time;
```

Client conflict query:

```sql
select *
from public.sessions
where client_id = :client_id
  and status = 'scheduled'
  and start_time < :new_end_time
  and end_time > :new_start_time;
```

If either query returns rows, reject the session.

---

## 14. Initial MVP Development Phases

### Phase 0 - Repository Setup

Goal:

Create a clean project foundation.

Tasks:

- Create GitHub repository
- Create root README
- Create backend folder
- Create frontend folder later
- Add .env.example
- Add formatting and linting setup

Deliverable:

- Clean repository ready for development

---

### Phase 1 - Supabase Database Foundation

Goal:

Create the first database foundation.

Tasks:

- Create Supabase project
- Install Supabase CLI
- Initialize Supabase locally
- Create migration for profiles
- Create migration for studios
- Create migration for studio_members
- Enable Row Level Security
- Add basic policies
- Generate TypeScript database types

Deliverable:

- Auth, profiles, studios, and studio members are ready

---

### Phase 2 - Backend Foundation

Goal:

Create a professional Express TypeScript backend.

Tasks:

- Set up Express
- Set up TypeScript
- Add env validation
- Add Supabase admin client
- Add auth middleware
- Add error middleware
- Add validation middleware
- Add health endpoint
- Add test setup

Deliverable:

- Backend runs locally and can verify authenticated users

---

### Phase 3 - Auth and Studio Module

Goal:

Users can create and access a studio.

Tasks:

- Implement GET /api/auth/me
- Create profile creation flow
- Implement POST /api/studios
- Insert owner membership when studio is created
- Implement studio read endpoint
- Add membership check helper
- Add integration tests

Deliverable:

- User signs up, creates a studio, and becomes owner

---

### Phase 4 - Client Management Module

Goal:

Studio owner or trainer can manage clients.

Tasks:

- Create client schema
- Create client route/controller/service
- Add create client endpoint
- Add list clients endpoint
- Add client detail endpoint
- Add update client endpoint
- Enforce studio membership
- Enforce owner/trainer permissions
- Add integration tests

Deliverable:

- Studio can securely manage clients

---

### Phase 5 - Workout Module

Goal:

Trainers can assign workouts and clients can log completion.

Tasks:

- Seed exercise library
- Create workout plan endpoint
- Add workout days
- Add workout items
- Add workout logs
- Enforce assigned trainer or owner permission
- Add tests

Deliverable:

- Workout plan workflow works end to end

---

### Phase 6 - Sessions Module

Goal:

Create appointment scheduling with conflict detection.

Tasks:

- Add trainer availability
- Create session endpoint
- Reject past sessions
- Reject end_time before start_time
- Reject trainer overlap
- Reject client overlap
- Add status update endpoint
- Add tests for overlapping sessions

Deliverable:

- Scheduling is secure and realistic

---

### Phase 7 - Check-ins and Progress

Goal:

Track client progress.

Tasks:

- Submit check-ins
- Submit measurements
- List check-ins
- List measurements
- Add simple trend calculation
- Add tests

Deliverable:

- Client progress can be tracked

---

### Phase 8 - Basic Analytics

Goal:

Create useful dashboard numbers.

Tasks:

- Active clients count
- Sessions this week
- Completed sessions this month
- Missed sessions this month
- Workout completion rate
- Missed check-ins count
- New clients this month

Deliverable:

- Studio dashboard has real backend analytics

---

### Phase 8.5 - Notifications and Reminders

Goal:

Close the gap between the project brief (which calls for notifications, scheduled
reminders, and AI summaries) and the phased plan above, which jumped straight from
analytics to the frontend. The `notifications`, `reminder_jobs`, and `ai_summaries`
tables already exist in the database and the `worker/` workspace is already
scaffolded with BullMQ and Redis — this phase wires them together before the
frontend is built, so the dashboard has real notification data to show.

Tasks:

- Notifications API module: `GET /api/notifications`, `PATCH /api/notifications/:notificationId/read`
- BullMQ queue infrastructure (`reminders`, `weekly-summaries`, `emails` queues) backed by Redis
- `reminder_jobs` rows created for both client and trainer when a session is booked
- Worker-side repeatable scheduler that polls `reminder_jobs` for due jobs, creates
  `notifications` rows, and marks jobs `sent`/`failed`
- Email delivery and AI weekly summaries deferred (env vars and tables exist, no
  provider chosen yet — stub-free, left for a later pass)

Deliverable:

- Users receive in-app notifications and session reminders are generated automatically

---

### Phase 8.6 - Email Delivery and AI Weekly Summaries (PENDING)

Goal:

Phase 8.5 shipped in-app notifications only — email delivery and AI-generated
weekly summaries were explicitly deferred because no provider had been chosen.
This phase closes that gap: pick an email provider (e.g. Resend, Postmark,
SendGrid) and an AI provider/model, then wire them into the existing
`emails` / `weekly-summaries` BullMQ queues and `ai_summaries` table so the
full notification loop (in-app + email + AI summary) can be tested end-to-end.

Tasks:

- Choose and integrate an email provider using the existing `EMAIL_API_KEY` /
  `EMAIL_FROM` env vars; add an `emails` queue processor in the worker that sends
  the actual email for `session_reminder` (and other) notification types
- Choose and integrate an AI provider using the existing `AI_API_KEY` / `AI_MODEL`
  env vars; add a `weekly-summaries` queue processor that generates and stores
  rows in `ai_summaries`
- Manual end-to-end test: book a session, confirm an email is actually delivered
  (not just an in-app `notifications` row)

Deliverable:

- Users receive real emails for session reminders, and weekly AI summaries are generated

---

### Phase 9 - Frontend MVP

Goal:

Create a usable dashboard.

Tasks:

- Login page
- Register page
- Dashboard layout
- Studio dashboard
- Client list
- Client detail
- Workout builder
- Sessions page
- Analytics page

Deliverable:

- Product is demo-ready

---

### Phase 10 - Deployment and Polish

Goal:

Make the project portfolio-ready.

Tasks:

- Add demo seed data
- Add final README
- Deploy Supabase
- Deploy backend
- Deploy frontend
- Add environment docs
- Record demo flow

Deliverable:

- Live deployed project with README and demo

---

## 15. Scale Roadmap After MVP

> **Superseded**: this section is now superseded by [`NEXT_PHASE_PLAN.md`](./NEXT_PHASE_PLAN.md),
> which carries the remaining Scale Steps (and everything beyond them) forward as Phases 1-10.
> Kept here for historical context only.

After the MVP works, improve the project in this order.

### Scale Step 1 - Background Jobs (moved into Phase 8.5)

Add:

- Redis
- BullMQ
- reminders queue
- emails queue
- reminder worker

Use cases:

- Upcoming session reminders
- Missed check-in reminders
- Inactive client reminders

> Pulled forward into Phase 8.5 (before the frontend) instead of being deferred —
> see section 14. The basic reminders queue + worker + in-app notifications API
> are now part of the MVP build order; missed-check-in / inactive-client reminders
> and the email queue remain future scale-ups.

### Scale Step 2 - Notifications (basic version moved into Phase 8.5)

Add:

- In-app notifications
- Mark notification as read
- Notification dropdown in frontend

> The backend half (notifications API + reminder-driven notification rows) is now
> part of Phase 8.5. The frontend dropdown remains part of Phase 9 / later scale-up.

### Scale Step 3 - Storage

Add:

- Avatar uploads
- Progress photo uploads
- Storage policies

### Scale Step 4 - AI Weekly Summary

Add:

- Weekly summary generation
- Safe prompt rules
- Store result in ai_summaries
- Show summary on client detail page

Rules:

- Do not provide medical advice
- Do not diagnose
- Do not promise outcomes
- Keep the summary trainer-focused

### Scale Step 5 - Advanced Analytics

Add:

- Revenue trends
- Client retention
- Workout adherence charts
- Session attendance charts
- Trainer performance overview

### Scale Step 6 - Frontend Polish

Add:

- Better loading states
- Empty states
- Error states
- Skeleton UI
- Better forms
- Responsive design

### Scale Step 7 - CI/CD

Add GitHub Actions:

- install dependencies
- lint
- typecheck
- run backend tests
- build frontend

---

## 16. Code Quality Rules

Follow these rules from the beginning.

### TypeScript

- Avoid any
- Use strict mode
- Use generated Supabase database types
- Type request user object

### Validation

- Validate every request body with Zod
- Validate query params when used
- Validate route params when needed

### Errors

- Use a shared ApiError class
- Do not throw random strings
- Use centralized error middleware
- Return consistent error response format

Example error shape:

```json
{
  "success": false,
  "error": {
    "message": "Client not found",
    "code": "CLIENT_NOT_FOUND"
  }
}
```

### Responses

Use consistent success responses:

```json
{
  "success": true,
  "data": {}
}
```

### Security

- Never expose service role key in frontend
- Never trust role from request body
- Always verify Supabase token
- Always check studio membership
- Use RLS as defense-in-depth
- Store secrets in environment variables

### Logging

Log important backend events:

- studio created
- client created
- workout plan created
- session created
- session conflict rejected
- auth failure
- worker failure

### Testing

Prioritize tests for:

- Auth middleware
- Role permissions
- Studio membership checks
- Client CRUD authorization
- Session conflict detection
- Analytics calculations

---

## 17. Suggested First Tables

Start with only these tables:

```txt
profiles
studios
studio_members
```

Then add:

```txt
clients
```

Then add workouts:

```txt
exercises
workout_plans
workout_days
workout_items
workout_logs
```

Then add sessions:

```txt
trainer_availability
sessions
```

Then add progress:

```txt
check_ins
measurements
```

This keeps development manageable.

---

## 18. First Backend Files to Create

Create these first:

```txt
backend/src/app.ts
backend/src/server.ts
backend/src/config/env.ts
backend/src/lib/supabase.ts
backend/src/middleware/auth.middleware.ts
backend/src/middleware/error.middleware.ts
backend/src/middleware/validate.middleware.ts
backend/src/utils/ApiError.ts
backend/src/utils/asyncHandler.ts
backend/src/modules/auth/auth.routes.ts
backend/src/modules/auth/auth.controller.ts
backend/src/modules/auth/auth.service.ts
backend/src/modules/studios/studios.routes.ts
backend/src/modules/studios/studios.controller.ts
backend/src/modules/studios/studios.service.ts
backend/src/modules/studios/studios.schema.ts
```

Do not create every module before you need it.

---

## 19. Definition of Done for MVP

The MVP is complete when:

- User can register and log in
- User can create a studio
- Studio owner can add clients
- Trainer can create a workout plan
- Client can log workout completion
- Trainer can schedule a session
- Overlapping sessions are rejected
- Client can submit a check-in
- Dashboard shows basic analytics
- Backend has integration tests
- Frontend can demo the main workflow
- Project is deployed
- README explains setup, architecture, API, and demo flow

---

## 20. Recommended First Task

Start with the database.

### First task checklist

1. Create Supabase project
2. Install Supabase CLI
3. Initialize Supabase locally
4. Create migration for profiles
5. Create migration for studios
6. Create migration for studio_members
7. Enable Row Level Security
8. Add basic policies
9. Test signup/login manually
10. Generate TypeScript database types
11. Commit the migration files

Only after this should you build the Express backend foundation.

---

## 21. Final Development Principle

Build small, working layers.

Each phase should leave the project in a working state.

Avoid adding advanced features until the core workflow works end to end.

A clean finished MVP is more valuable than an unfinished huge app.
