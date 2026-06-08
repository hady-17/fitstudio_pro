## Notifications API Examples

Access: any authenticated user, scoped strictly to their own notifications
(`user_id = auth.uid()`).

---

### GET /api/notifications
List the current user's notifications, newest first.

Query params (all optional):
- `limit` — page size (default 50)
- `offset` — page offset (default 0)
- `unreadOnly` — `true` | `false`, filters to `read_at is null`

Example:
```
GET /api/notifications?unreadOnly=true&limit=20
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "5e7...",
        "user_id": "1a2...",
        "type": "session_reminder",
        "title": "Upcoming session",
        "message": "Your session with Jane Doe starts in 1 hour",
        "read_at": null,
        "created_at": "2026-06-08T09:00:00.000Z"
      }
    ]
  }
}
```

---

### PATCH /api/notifications/:notificationId/read
Mark a single notification as read.

Example:
```
PATCH /api/notifications/<notificationId>/read
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "5e7...",
      "user_id": "1a2...",
      "type": "session_reminder",
      "title": "Upcoming session",
      "message": "Your session with Jane Doe starts in 1 hour",
      "read_at": "2026-06-08T09:05:00.000Z",
      "created_at": "2026-06-08T09:00:00.000Z"
    }
  }
}
```

Error responses:
- `404` — notification not found
- `403` — notification belongs to a different user

---

### Notes

- Notifications are created by the background worker (see `worker/src/worker.ts`),
  which polls `reminder_jobs` for due session reminders and writes a row here for
  each recipient.
- Email delivery and AI-generated weekly summaries are **not yet implemented** —
  the `EMAIL_API_KEY` / `EMAIL_FROM` / `AI_API_KEY` / `AI_MODEL` env vars and the
  `ai_summaries` table exist for future work but nothing consumes them yet.
