# FitStudio Pro

Full-stack SaaS platform for personal trainers and fitness studios to manage clients, workout plans, appointments, progress tracking, reminders, and business analytics.

## Project Structure

```
fitstudio-pro/
├── backend/          # Express API (Node.js + TypeScript)
├── frontend/         # Next.js dashboard (React + TypeScript)
├── worker/           # Background job worker (BullMQ + Redis)
└── supabase/         # Database migrations and configuration
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Supabase PostgreSQL
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Supabase PostgreSQL, Auth, Storage
- **Background Jobs**: Redis, BullMQ
- **Testing**: Jest, Supertest
- **Deployment**: Vercel, Render/Railway, Upstash

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Redis (local or via Docker)
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd fitstudio-pro
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
cp worker/.env.example worker/.env.local
```

4. Configure Supabase credentials in `.env.local` files

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

## Documentation

- [Project Brief](./fitstudio-pro-supabase-project-brief.md) - Complete project specification
- [Backend API](./backend/README.md) - API documentation
- [Frontend Guide](./frontend/README.md) - UI and component guide

## MVP Features

- ✅ Supabase Auth (register/login)
- ✅ Studio workspace management
- ✅ Role-based access control
- ✅ Client management
- ✅ Workout plan creation and assignment
- ✅ Workout completion logging
- ✅ Weekly check-ins
- ✅ Session booking with conflict detection
- ✅ Business analytics dashboard
- ✅ Background reminders
- ✅ AI weekly summaries

## Testing

```bash
npm run test
```

## Deployment

See deployment guides in backend and frontend directories.

## License

ISC
