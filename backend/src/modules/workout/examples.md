GET http://localhost:3000/api/studios/{studioId}/workout-plans — lists all workout plans for the studio, with optional filters like status, client, trainer, search, limit, and offset.

POST http://localhost:3000/api/studios/{studioId}/workout-plans — creates a new workout plan for a client in that studio.

GET http://localhost:3000/api/studios/{studioId}/workout-plans/{planId} — fetches one workout plan by its id, including client and trainer details.

PATCH http://localhost:3000/api/studios/{studioId}/workout-plans/{planId} — updates an existing workout plan’s fields like title, dates, description, or status.

DELETE http://localhost:3000/api/studios/{studioId}/workout-plans/{planId} — archives the workout plan as a soft delete.

POST http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days — creates a new workout day inside the plan.

PATCH http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days/{dayId} — updates a workout day, such as its day number, title, or notes.

DELETE http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days/{dayId} — deletes a workout day from the plan.

POST http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days/{dayId}/items — creates a workout item inside a specific day.

PATCH http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days/{dayId}/items/{itemId} — updates a workout item, like sets, reps, weight, rest, or notes.

DELETE http://localhost:3000/api/studios/{studioId}/workout-plans/{planId}/days/{dayId}/items/{itemId} — deletes a workout item from the day.

---

## Full API Reference with Example Bodies

Base URL: `http://localhost:4000`  
Studio ID (example): `fd001f92-8907-498b-a3e3-2c5a8c71f2d2`  
Plan ID (example): `12729ac6-920b-43c9-a810-a0ebf5b033a6`

All requests require:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Workout Plans

#### GET /api/studios/:studioId/workout-plans
```
GET http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans

Query params (all optional):
  ?status=active
  &trainerId=<uuid>
  &clientId=<uuid>
  &search=chest
  &limit=20
  &offset=0
```

#### POST /api/studios/:studioId/workout-plans
```
POST http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans

{
  "clientId": "b2e4f1a0-1234-4abc-9def-000000000001",
  "title": "12-Week Strength Program",
  "description": "Progressive overload strength plan targeting all major muscle groups.",
  "startDate": "2026-06-09",
  "endDate": "2026-09-01",
  "status": "draft"
}
```

#### GET /api/studios/:studioId/workout-plans/:planId
```
GET http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6
```

#### PATCH /api/studios/:studioId/workout-plans/:planId
```
PATCH http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6

{
  "title": "12-Week Strength Program (Updated)",
  "description": "Updated description with revised goals.",
  "startDate": "2026-06-10",
  "endDate": "2026-09-10",
  "status": "active"
}
```

#### DELETE /api/studios/:studioId/workout-plans/:planId
```
DELETE http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6

Response: { "deleted": true, "planId": "12729ac6-920b-43c9-a810-a0ebf5b033a6" }
```

---

### Workout Days

#### POST /api/studios/:studioId/workout-plans/:planId/days
```
POST http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days

{
  "dayNumber": 1,
  "title": "Day 1 — Push (Chest, Shoulders, Triceps)",
  "notes": "Focus on controlled eccentric phase. Rest 90s between sets."
}
```

#### PATCH /api/studios/:studioId/workout-plans/:planId/days/:dayId
```
PATCH http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days/<dayId>

{
  "dayNumber": 2,
  "title": "Day 2 — Pull (Back, Biceps)",
  "notes": "Emphasize scapular retraction on rows."
}
```

#### DELETE /api/studios/:studioId/workout-plans/:planId/days/:dayId
```
DELETE http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days/<dayId>

Response: { "deleted": true, "dayId": "<dayId>" }
```

---

### Workout Items

#### POST /api/studios/:studioId/workout-plans/:planId/days/:dayId/items
```
POST http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days/<dayId>/items

{
  "exerciseId": "e1a2b3c4-0000-4000-8000-000000000001",
  "sets": 4,
  "reps": "8-10",
  "targetWeight": "80kg",
  "restSeconds": 90,
  "notes": "Keep elbows tucked. Full range of motion."
}
```

#### PATCH /api/studios/:studioId/workout-plans/:planId/days/:dayId/items/:itemId
```
PATCH http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days/<dayId>/items/<itemId>

{
  "sets": 5,
  "reps": "6-8",
  "targetWeight": "85kg",
  "restSeconds": 120,
  "notes": "Increase load this week."
}
```

#### DELETE /api/studios/:studioId/workout-plans/:planId/days/:dayId/items/:itemId
```
DELETE http://localhost:4000/api/studios/fd001f92-8907-498b-a3e3-2c5a8c71f2d2/workout-plans/12729ac6-920b-43c9-a810-a0ebf5b033a6/days/<dayId>/items/<itemId>

Response: { "deleted": true, "itemId": "<itemId>" }
```

---

### Workout Logs

#### POST /api/clients/:clientId/workout-logs
```
POST http://localhost:4000/api/clients/<clientId>/workout-logs

{
  "workoutDayId": "<dayId>",
  "completedAt": "2026-06-06T10:30:00.000Z",
  "difficultyRating": 7,
  "feedback": "Felt strong today. Bench press felt easy at 80kg, ready to increase."
}
```

#### GET /api/clients/:clientId/workout-logs
```
GET http://localhost:4000/api/clients/<clientId>/workout-logs

Query params (optional):
  ?limit=50
  &offset=0
```

---

### Field Reference

| Field | Type | Constraints |
|---|---|---|
| `title` (plan) | string | 2–150 chars |
| `description` | string | max 1000 chars |
| `startDate` / `endDate` | string | YYYY-MM-DD; endDate >= startDate |
| `status` | enum | `draft` \| `active` \| `completed` \| `archived` |
| `dayNumber` | integer | 1–7, unique per plan, max 7 days |
| `title` (day) | string | 2–100 chars |
| `sets` | integer | 1–20 |
| `reps` | string | max 50 chars (e.g. "8-10", "12", "AMRAP") |
| `targetWeight` | string | max 50 chars (e.g. "80kg", "BW+20lbs") |
| `restSeconds` | integer | 0–3600 |
| `difficultyRating` | integer | 1–10 |
| `feedback` | string | max 1000 chars |