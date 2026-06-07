## Check-ins & Progress API Examples

Access rules for every endpoint below: the client themselves, the studio owner, or
the client's assigned trainer (trainers cannot access clients assigned to someone else).

---

### POST /api/clients/:clientId/check-ins
Submit a weekly check-in for a client. At least one field must be provided.

Optional body (all fields optional, but at least one is required):
```json
{
  "weight": 80.5,
  "mood": 7,
  "energyLevel": 6,
  "sleepHours": 7.5,
  "notes": "Felt strong this week, sleep has improved."
}
```

Success response `201`:
```json
{
  "success": true,
  "data": {
    "checkIn": {
      "id": "uuid",
      "client_id": "uuid",
      "weight": 80.5,
      "mood": 7,
      "energy_level": 6,
      "sleep_hours": 7.5,
      "notes": "Felt strong this week, sleep has improved.",
      "created_at": "2026-06-08T10:00:00.000Z"
    }
  }
}
```

Error responses:
- `400` — no fields provided / values out of range (e.g. `mood` not between 1–10)
- `403` — requester does not have access to this client
- `403` — trainer is not assigned to this client
- `404` — client not found

---

### GET /api/clients/:clientId/check-ins
List check-ins for a client, most recent first.

Optional query params:
| Param | Type | Description |
|---|---|---|
| `limit` | number | Max results to return (default 50) |
| `offset` | number | Number of results to skip (default 0) |

Example:
```
GET /api/clients/<clientId>/check-ins?limit=20&offset=0
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "checkIns": [ ...check-in objects ]
  }
}
```

---

### POST /api/clients/:clientId/measurements
Submit body measurements for a client. At least one measurement must be provided.

Optional body (all fields optional, but at least one is required):
```json
{
  "weight": 80.5,
  "waist": 85,
  "chest": 100,
  "arms": 35,
  "legs": 55
}
```

Success response `201`:
```json
{
  "success": true,
  "data": {
    "measurement": {
      "id": "uuid",
      "client_id": "uuid",
      "weight": 80.5,
      "waist": 85,
      "chest": 100,
      "arms": 35,
      "legs": 55,
      "created_at": "2026-06-08T10:00:00.000Z"
    }
  }
}
```

Error responses:
- `400` — no measurements provided / values not greater than 0
- `403` — requester does not have access to this client
- `403` — trainer is not assigned to this client
- `404` — client not found

---

### GET /api/clients/:clientId/measurements
List body measurements for a client, most recent first.

Optional query params:
| Param | Type | Description |
|---|---|---|
| `limit` | number | Max results to return (default 50) |
| `offset` | number | Number of results to skip (default 0) |

Example:
```
GET /api/clients/<clientId>/measurements?limit=20&offset=0
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "measurements": [ ...measurement objects ]
  }
}
```

---

### GET /api/clients/:clientId/progress/trend
Simple weight trend comparing the latest entry to the previous one, computed
separately from check-ins and from measurements (entries with no recorded weight
are skipped).

Example:
```
GET /api/clients/<clientId>/progress/trend
```

Success response `200`:
```json
{
  "success": true,
  "data": {
    "trend": {
      "checkInWeight": {
        "latest": { "weight": 79, "recordedAt": "2026-06-08T10:00:00.000Z" },
        "previous": { "weight": 80.5, "recordedAt": "2026-06-01T10:00:00.000Z" },
        "change": -1.5,
        "direction": "down"
      },
      "measurementWeight": {
        "latest": { "weight": 79, "recordedAt": "2026-06-08T10:00:00.000Z" },
        "previous": null,
        "change": null,
        "direction": null
      }
    }
  }
}
```

`direction` is one of `up`, `down`, or `stable`. `previous`, `change`, and `direction`
are `null` when there are fewer than two weight entries to compare; `latest` is `null`
when there are none.

Error responses:
- `403` — requester does not have access to this client
- `403` — trainer is not assigned to this client
- `404` — client not found

---

### Field Reference

| Field | Type | Constraints |
|---|---|---|
| `weight` (check-in / measurement) | number | > 0 |
| `mood` | integer | 1–10 |
| `energyLevel` | integer | 1–10 |
| `sleepHours` | number | >= 0 |
| `notes` | string | max 1000 chars |
| `waist` / `chest` / `arms` / `legs` | number | > 0 |
| `limit` / `offset` | integer string (query) | non-negative |
