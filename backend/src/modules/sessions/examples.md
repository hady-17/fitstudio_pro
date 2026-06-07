## Sessions API Examples

---

### POST /api/studios/:studioId/sessions
Book a new session. Rejects if the trainer or client already has an overlapping scheduled session, or if the start time is in the past.

Required body:
```json
{
  "trainerId": "uuid",
  "clientId": "uuid",
  "startTime": "2026-06-10T09:00:00.000Z",
  "endTime": "2026-06-10T10:00:00.000Z"
}
```

Optional body:
```json
{
  "notes": "First session — focus on assessment"
}
```

Success response `201`:
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "studio_id": "uuid",
      "trainer_id": "uuid",
      "client_id": "uuid",
      "start_time": "2026-06-10T09:00:00.000Z",
      "end_time": "2026-06-10T10:00:00.000Z",
      "status": "scheduled",
      "notes": "First session — focus on assessment",
      "created_at": "...",
      "updated_at": "...",
      "trainer": { "id": "uuid", "full_name": "John Smith", "email": "john@example.com", "avatar_url": null },
      "client": { "id": "uuid", "full_name": "Alice Doe", "email": "alice@example.com" }
    }
  }
}
```

Error responses:
- `400` — start time is in the past
- `400` — endTime is not after startTime
- `403` — requester is not a studio member
- `404` — client not found in this studio
- `404` — trainer not found in this studio
- `409` — trainer already has a session during this time
- `409` — client already has a session during this time

---

### GET /api/studios/:studioId/sessions
List sessions. Owners see all sessions in the studio. Trainers only see their own.

Optional query params:
| Param | Type | Description |
|---|---|---|
| `trainerId` | uuid | Filter by trainer |
| `clientId` | uuid | Filter by client |
| `status` | string | `scheduled` \| `completed` \| `cancelled` \| `no_show` |
| `dateFrom` | ISO 8601 datetime | Sessions starting at or after this time |
| `dateTo` | ISO 8601 datetime | Sessions starting at or before this time |
| `limit` | number | Max results to return |
| `offset` | number | Number of results to skip |

Example:
```
GET /api/studios/abc-123/sessions?status=scheduled&dateFrom=2026-06-10T00:00:00.000Z&limit=20
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "sessions": [ ...session objects ]
  }
}
```

---

### PATCH /api/sessions/:sessionId/status
Update the status of a session. Only works on sessions with status `scheduled`. Trainers can only update their own sessions.

Required body:
```json
{
  "status": "completed"
}
```

Valid values: `completed`, `cancelled`, `no_show`

Success response `200`:
```json
{
  "success": true,
  "data": {
    "session": { ...updated session object }
  }
}
```

Error responses:
- `400` — session status is not `scheduled` (already completed or cancelled)
- `403` — trainer trying to update someone else's session
- `403` — requester is not a studio member
- `404` — session not found
