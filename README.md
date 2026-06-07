# FitStudio Pro

A full-stack SaaS platform that gives personal trainers and fitness studios a single
place to run their business: manage clients, build and assign workout plans, book
sessions, track client progress, and (eventually) see business analytics — all backed
by a multi-tenant Supabase/Postgres database with row-level security.

The project is built as an MVP following a 10-phase build plan
(see [`fitstudio-pro-mvp-mvc-scalable-plan.md`](./fitstudio-pro-mvp-mvc-scalable-plan.md)
and [`fitstudio-pro-supabase-project-brief.md`](./fitstudio-pro-supabase-project-brief.md)
for the full specification).

## How it's organized

A **studio** is the tenant: it has members with roles (`owner` / `trainer`), and owns
clients, workout plans, sessions, and progress data. Access is enforced both at the
database level (Postgres RLS policies) and in the API layer (role + assignment checks),
so:

- **Studio owners** can manage everything within their studio.
- **Trainers** can only act on clients assigned to them.
- **Clients** can view and submit their own data (workout logs, check-ins, measurements).

## Project Structure

```
fitstudio-pro/
├── backend/          # Express API (Node.js + TypeScript)
├── frontend/         # Next.js dashboard (React + TypeScript)
├── worker/           # Background job worker (BullMQ + Redis)
└── supabase/         # Database migrations, seed data, and config
```

### Backend module layout

The API is organized by domain module under `backend/src/modules/`, each with its own
`*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.schema.ts` (Zod validation):

| Module      | Responsibility                                                            |
|-------------|---------------------------------------------------------------------------|
| `auth`      | Current user (`/me`), linking auth users to client profiles              |
| `studios`   | Studio CRUD, members/trainers management                                 |
| `clients`   | Client CRUD, trainer assignment, email uniqueness                        |
| `exercises` | Exercise library lookup (search, filter by muscle group/equipment/level) |
| `workout`   | Workout plans, days, items, exercise assignment, and workout logs        |
| `sessions`  | Session booking with conflict detection, status updates                  |
| `checkins`  | Client check-ins, body measurements, and simple progress trend           |

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Zod validation, Winston logging
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL, Auth, Storage, Row-Level Security)
- **Background Jobs**: Redis, BullMQ (reminders, AI summaries)
- **Testing**: Jest (unit + integration), Supertest
- **Deployment**: Vercel (frontend), Render/Railway (backend/worker), Upstash (Redis)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Redis (local or via Docker)
- Supabase account (or local Supabase via the `supabase` CLI)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd fitstudio-pro
```

2. Install dependencies (npm workspaces: backend, frontend, worker)
```bash
npm install
```

3. Set up environment variables for each service (see each workspace's `.env`
   requirements — Supabase URL/keys, Redis connection, frontend URL, etc.)

4. Apply database migrations (from `supabase/migrations/`) to your Supabase project

### Development

Start all services in development mode:
```bash
npm run dev
```

Or run individual services:
```bash
npm run backend:dev
npm run frontend:dev
npm run worker:dev
```

## API Overview

All endpoints are mounted under `/api` and require a Supabase auth token unless noted.
Studio-scoped routes enforce owner/trainer role checks; client-scoped routes additionally
allow the client themselves to access their own data.

**Auth**
- `GET /api/auth/me` — current user profile
- `POST /api/auth/link-client-profile` — link an auth user to a client record

**Studios**
- `GET /api/studios/me` — studios the current user belongs to
- `POST /api/studios` — create a studio
- `GET /api/studios/:studioId` — get studio details
- `PATCH /api/studios/:studioId` — update studio
- `DELETE /api/studios/:studioId` — delete studio
- `GET /api/studios/:studioId/members` — list studio members
- `POST /api/studios/:studioId/trainers` — add a trainer
- `DELETE /api/studios/:studioId/members/:memberId` — remove a member

**Clients**
- `GET /api/studios/:studioId/clients`, `GET /api/clients/:clientId` — list/get
- `POST /api/clients` — create a client
- `PATCH /api/clients/:clientId`, `DELETE /api/clients/:clientId` — update/delete

**Exercises**
- `GET /api/exercises` — search/filter the exercise library

**Workouts**
- `GET/POST /api/studios/:studioId/workout-plans` — list/create plans
- `GET/PATCH/DELETE /api/studios/:studioId/workout-plans/:planId` — get/update/archive
- `POST/PATCH/DELETE .../workout-plans/:planId/days[/:dayId]` — manage workout days
- `POST/PATCH/DELETE .../days/:dayId/items[/:itemId]` — manage workout items (exercises)
- `POST/GET /api/clients/:clientId/workout-logs` — log/list completed workout days

**Sessions**
- `POST/GET /api/studios/:studioId/sessions` — book/list sessions (with conflict detection)
- `PATCH /api/sessions/:sessionId/status` — mark `completed` / `cancelled` / `no_show`

**Check-ins & Progress**
- `POST/GET /api/clients/:clientId/check-ins` — submit/list weekly check-ins (weight, mood, energy, sleep, notes)
- `POST/GET /api/clients/:clientId/measurements` — submit/list body measurements (weight, waist, chest, arms, legs)
- `GET /api/clients/:clientId/progress/trend` — simple weight trend (latest vs. previous entry)

## Roadmap (MVP phases)

- [x] Phase 0–2 — Repo setup, database foundation, backend scaffolding
- [x] Phase 3 — Auth + Studio management
- [x] Phase 4 — Client management
- [x] Phase 5 — Workout plans, items, and logging
- [x] Phase 6 — Session booking with conflict detection
- [x] Phase 7 — Check-ins, measurements, and progress trend
- [ ] Phase 8 — Business analytics dashboard
- [ ] Phase 9 — Frontend dashboard
- [ ] Phase 10 — Deployment and polish

## Testing

```bash
npm run test
```

Backend unit tests live in `backend/tests/services/` (Supabase client mocked) and cover
every service module's authorization rules and data operations.

## Deployment

See deployment guides in the backend and frontend directories.

## License

ISC
