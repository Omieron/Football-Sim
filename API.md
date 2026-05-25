# Pitchline — API Documentation (Postman)

**Base URL (local backend):** `http://localhost:8080`

**Base URL (Docker — Postman direct):** `http://YOUR_SERVER_IP:9011`

**Base URL (Docker — via nginx):** `http://YOUR_SERVER_IP:9010` — same paths below (`/api/...`, `/health`)

> Default ports are set in `.env` (`HTTP_PORT=9010`, `BACKEND_PORT=9011`). Change them if your server uses a different range.

## Recommended Test Order

1. `POST /api/admin/seed` — Populate the database
2. `GET /api/teams` — List teams, grab an id
3. `POST /api/leagues` — Create a league, grab an id
4. `POST /api/leagues/:id/weeks/1/play` — Play week 1
5. `GET /api/leagues/:id/standings` — Check the standings

---

## Health Check

### GET /health
Checks whether the server is up and running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Admin

### POST /api/admin/seed
Seeds the database with sample team and player data. Run this first before anything else.

- **Body:** None
- **Headers:** None

**Response:**
```json
{
  "message": "seed completed",
  "data": { ... }
}
```

---

## Teams

### GET /api/teams
Returns all teams.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Galatasaray",
      "short_name": "GS",
      "crest_url": "https://...",
      "attack": 85,
      "defense": 78,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/teams/:id
Returns a single team by id.

**URL Params:** `id` — team id

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Galatasaray",
    "short_name": "GS",
    "crest_url": "",
    "attack": 85,
    "defense": 78,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /api/teams
Creates a new team.

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "name": "Galatasaray",
  "short_name": "GS",
  "crest_url": "https://example.com/logo.png",
  "attack": 85,
  "defense": 78
}
```

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | — |
| `short_name` | No | — |
| `crest_url` | No | — |
| `attack` | Yes | 1–100 |
| `defense` | Yes | 1–100 |

**Response (201):**
```json
{
  "data": {
    "id": 5,
    "name": "Galatasaray",
    "short_name": "GS",
    "crest_url": "https://example.com/logo.png",
    "attack": 85,
    "defense": 78,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /api/teams/:id
Updates a team. Fields you omit stay unchanged (partial update).

**URL Params:** `id` — team id

**Headers:** `Content-Type: application/json`

**Body (partial update supported):**
```json
{
  "name": "Galatasaray SK",
  "attack": 90
}
```

| Field | Required | Rule |
|-------|----------|------|
| `name` | No | — |
| `short_name` | No | — |
| `crest_url` | No | — |
| `attack` | No | 1–100 |
| `defense` | No | 1–100 |

**Response (200):**
```json
{
  "data": { ...updated team... }
}
```

---

### DELETE /api/teams/:id
Deletes a team.

**URL Params:** `id` — team id

**Response:**
```json
{
  "message": "takım silindi"
}
```

---

### GET /api/teams/:id/players
Returns all players belonging to a team.

**URL Params:** `id` — team id

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "team_id": 1,
      "name": "Icardi",
      "position": "FWD",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/teams/:id/players
Adds a player to a team.

**URL Params:** `id` — team id

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "name": "Icardi",
  "position": "FWD"
}
```

| Field | Required | Valid Values |
|-------|----------|--------------|
| `name` | Yes | — |
| `position` | Yes | `GK`, `DEF`, `MID`, `FWD` |

**Response (201):**
```json
{
  "data": {
    "id": 12,
    "team_id": 1,
    "name": "Icardi",
    "position": "FWD",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Leagues

### GET /api/leagues
Returns all leagues.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Super League",
      "status": "active",
      "current_week": 3,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### GET /api/leagues/:id
Returns a single league by id.

**URL Params:** `id` — league id

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "Super League",
    "status": "active",
    "current_week": 3,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /api/leagues
Creates a new league. At least 4 team ids are required. Fixtures are generated automatically.

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "name": "Super League",
  "team_ids": [1, 2, 3, 4]
}
```

| Field | Required | Rule |
|-------|----------|------|
| `name` | Yes | — |
| `team_ids` | Yes | Minimum 4 teams |

**Response (201):**
```json
{
  "data": {
    "id": 1,
    "name": "Super League",
    "status": "pending",
    "current_week": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### DELETE /api/leagues/:id/reset
Resets a league — all match results and standings are deleted, current week goes back to 0. Teams remain in the league.

**URL Params:** `id` — league id

**Body:** None

**Response:**
```json
{
  "message": "lig sıfırlandı"
}
```

---

### GET /api/leagues/:id/standings
Returns the current standings for a league.

**URL Params:** `id` — league id

**Response:**
```json
{
  "data": [
    {
      "team_id": 1,
      "team_name": "Galatasaray",
      "played": 5,
      "won": 4,
      "drawn": 1,
      "lost": 0,
      "goals_for": 12,
      "goals_against": 4,
      "goal_diff": 8,
      "points": 13
    }
  ]
}
```

---

### GET /api/leagues/:id/fixtures
Returns all fixtures (matches) for a league.

**URL Params:** `id` — league id

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "league_id": 1,
      "week": 1,
      "home_team_id": 1,
      "home_team_name": "Galatasaray",
      "away_team_id": 2,
      "away_team_name": "Fenerbahce",
      "home_goals": 2,
      "away_goals": 1,
      "played": true
    }
  ]
}
```

---

### GET /api/leagues/:id/predictions
Returns championship probabilities calculated via Monte Carlo simulation (1000 runs). **At least 4 matchdays must be completed** before this endpoint returns data — calling it earlier returns `400`.

**URL Params:** `id` — league id

**Response:**
```json
{
  "data": [
    {
      "team_id": 1,
      "team_name": "Galatasaray",
      "crest_url": "https://...",
      "percentage": 67.3
    },
    {
      "team_id": 2,
      "team_name": "Fenerbahce",
      "crest_url": "https://...",
      "percentage": 22.1
    }
  ]
}
```

---

## Weeks & Match Simulation

### GET /api/leagues/:id/weeks/:week
Returns all matches for a specific week.

**URL Params:**
- `id` — league id
- `week` — week number (1, 2, 3, ...)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "week": 1,
      "home_team_name": "Galatasaray",
      "away_team_name": "Fenerbahce",
      "home_goals": 0,
      "away_goals": 0,
      "played": false
    }
  ]
}
```

---

### POST /api/leagues/:id/weeks/:week/play
Simulates a specific week and saves the results.

**URL Params:**
- `id` — league id
- `week` — week number

**Body:** None

**Response:**
```json
{
  "message": "hafta oynanıldı",
  "data": [
    {
      "id": 1,
      "week": 1,
      "home_team_name": "Galatasaray",
      "away_team_name": "Fenerbahce",
      "home_goals": 3,
      "away_goals": 1,
      "played": true,
      "events": [
        {
          "type": "goal",
          "minute": 23,
          "player_name": "Icardi",
          "team_name": "Galatasaray"
        }
      ]
    }
  ]
}
```

---

### POST /api/leagues/:id/play-all
Simulates all remaining weeks in the league at once. Returns every week's results grouped by matchday.

**URL Params:** `id` — league id

**Body:** None

**Response:**
```json
{
  "message": "all matches played",
  "data": [
    {
      "week": 5,
      "matches": [
        {
          "id": 9,
          "week": 5,
          "home_team_name": "Arsenal",
          "away_team_name": "Liverpool",
          "home_goals": 2,
          "away_goals": 1,
          "played": true,
          "events": [
            { "type": "goal", "minute": 34, "player_name": "Saka", "team_name": "Arsenal" }
          ]
        }
      ]
    },
    {
      "week": 6,
      "matches": [ ... ]
    }
  ]
}
```

---

## Matches

### GET /api/matches/:id
Returns the events for a specific match.

**URL Params:** `id` — match id

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "match_id": 1,
      "type": "goal",
      "minute": 34,
      "player_name": "Icardi",
      "team_name": "Galatasaray"
    },
    {
      "id": 2,
      "match_id": 1,
      "type": "yellow_card",
      "minute": 57,
      "player_name": "Szymanski",
      "team_name": "Fenerbahce"
    }
  ]
}
```

---

### PUT /api/matches/:id
Manually updates the score of a played match.

**URL Params:** `id` — match id

**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "home_goals": 3,
  "away_goals": 2
}
```

| Field | Required | Rule |
|-------|----------|------|
| `home_goals` | Yes | 0 or above |
| `away_goals` | Yes | 0 or above |

**Response:**
```json
{
  "message": "skor güncellendi",
  "data": {
    "id": 1,
    "home_goals": 3,
    "away_goals": 2,
    "played": true
  }
}
```

---

### GET /api/matches/:id/events
Returns all events (goals, yellow cards, red cards) for a match.

**URL Params:** `id` — match id

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "match_id": 1,
      "type": "goal",
      "minute": 23,
      "player_name": "Icardi",
      "position": "FWD",
      "team_name": "Galatasaray"
    },
    {
      "id": 2,
      "match_id": 1,
      "type": "red_card",
      "minute": 78,
      "player_name": "Szymanski",
      "position": "MID",
      "team_name": "Fenerbahce"
    }
  ]
}
```

**Event types:** `goal` | `yellow_card` | `red_card`

---

## Error Responses

All endpoints return the same format on error:

```json
{
  "error": "error message"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad request / validation error |
| 404 | Resource not found |
| 500 | Internal server error |
