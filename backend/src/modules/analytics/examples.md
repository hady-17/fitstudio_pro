## Analytics API Examples

Access: studio owners and trainers only. Owners get studio-wide numbers; trainers get
the same shape scoped to clients, sessions, and workout plans assigned to them.

---

### GET /api/studios/:studioId/analytics/overview
Dashboard overview numbers for a studio.

Example:
```
GET /api/studios/<studioId>/analytics/overview
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeClients": 12,
      "newClientsThisMonth": 3,
      "sessionsThisWeek": 5,
      "completedSessionsThisMonth": 8,
      "missedSessionsThisMonth": 2,
      "workoutCompletionRate": 50,
      "missedCheckIns": 2
    }
  }
}
```

Error responses:
- `403` — requester is not a member of this studio
- `403` — requester is a `client` member (only owners/trainers can view analytics)
- `404` — studio not found

---

### Field Reference

| Field | Meaning |
|---|---|
| `activeClients` | Count of clients with `status = 'active'` |
| `newClientsThisMonth` | Clients whose `joined_at` falls within the current calendar month |
| `sessionsThisWeek` | Sessions with `start_time` in the current week (Monday–Sunday) |
| `completedSessionsThisMonth` | Sessions with `status = 'completed'` and `start_time` in the current calendar month |
| `missedSessionsThisMonth` | Sessions with `status = 'no_show'` and `start_time` in the current calendar month |
| `workoutCompletionRate` | % of workout days (across active workout plans) with at least one completion log. `null` when there are no active plans |
| `missedCheckIns` | Active clients with no check-in submitted in the last 7 days |

All "this week" / "this month" windows are computed in UTC relative to the time the
request is made.
