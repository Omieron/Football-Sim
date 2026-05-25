# How to Run — Football League Simulation

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Go | 1.21+ |
| PostgreSQL | 14+ |

---

## 1. Database Setup

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE league;
\q
```

Load the full schema (tables, triggers, views, indexes):

```bash
psql -U postgres -d league -f sql/tables.sql
```

---

## 2. Environment Configuration

Copy the example env file and fill in your database credentials:

```bash
cp backend/.env-example backend/.env
```

Open `backend/.env` and set your values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=league
SERVER_PORT=8080
```

> All fields except `DB_PASSWORD` have sensible defaults — if your local Postgres uses the defaults above, you only need to set `DB_PASSWORD`.

---

## 3. Install Dependencies & Run

```bash
cd backend
go mod tidy
go run ./cmd/main.go
```

You should see:

```
PostgreSQL connected
Server started: http://localhost:8080
```

The API is now live at `http://localhost:8080`.

---

## 4. Testing via Postman — Full Happy Path

Follow these steps in order. Each step uses the id returned by the previous one.

### Step 1 — Seed teams & players

**Option A — From ESPN (requires internet):**

Seed only the English Premier League (fast, ~20 teams):

```
POST http://localhost:8080/api/admin/seed
Content-Type: application/json

{
  "league_codes": ["eng.1"]
}
```

> Sending an empty body seeds all 10 supported leagues (~200 teams). This takes 2–3 minutes. For a quick demo, always pass `league_codes`.

Available league codes: `eng.1` (Premier League), `esp.1` (La Liga), `ger.1` (Bundesliga), `ita.1` (Serie A), `fra.1` (Ligue 1), `tur.1` (Süper Lig)

---

**Option B — Create teams manually (no internet needed):**

Create 4 teams with custom strength ratings (attack/defense: 1–100):

```
POST http://localhost:8080/api/teams
Content-Type: application/json

{ "name": "Manchester City", "short_name": "MCI", "attack": 90, "defense": 85 }
```

Repeat for the other 3 teams:

```json
{ "name": "Liverpool",       "short_name": "LIV", "attack": 87, "defense": 82 }
{ "name": "Arsenal",         "short_name": "ARS", "attack": 83, "defense": 80 }
{ "name": "Chelsea",         "short_name": "CHE", "attack": 80, "defense": 78 }
```

Each response returns the team's `id`. Note them down for Step 2.

---

### Step 2 — List teams & get IDs

```
GET http://localhost:8080/api/teams
```

Pick 4 team `id` values to use in the next step.

---

### Step 3 — Create a league

```
POST http://localhost:8080/api/leagues
Content-Type: application/json

{
  "name": "Insider League",
  "team_ids": [1, 2, 3, 4]
}
```

Response returns the league `id` (e.g. `1`). Fixtures for all 6 weeks are generated automatically (4 teams × double round-robin = 6 matchdays, 2 matches each).

---

### Step 4 — Play matches week by week

Play week 1:

```
POST http://localhost:8080/api/leagues/1/weeks/1/play
```

Check standings after each week:

```
GET http://localhost:8080/api/leagues/1/standings
```

Check a specific week's matches:

```
GET http://localhost:8080/api/leagues/1/weeks/1
```

Repeat for weeks 2, 3, 4.

---

### Step 5 — Championship predictions (available from week 4 onwards)

```
GET http://localhost:8080/api/leagues/1/predictions
```

Returns Monte Carlo championship probabilities for each team. Calling this before week 4 is completed returns a `400` error.

---

### Step 6 — Play all remaining weeks at once

```
POST http://localhost:8080/api/leagues/1/play-all
```

Response includes every remaining week's results grouped by matchday:

```json
{
  "message": "all matches played",
  "data": [
    {
      "week": 5,
      "matches": [
        { "home_team_name": "Arsenal", "away_team_name": "Liverpool", "home_goals": 2, "away_goals": 1, "played": true }
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

### Step 7 — Edit a match result & verify standings update

Get all fixtures to find a match `id`:

```
GET http://localhost:8080/api/leagues/1/fixtures
```

Edit the score of match `id` 3:

```
PUT http://localhost:8080/api/matches/3
Content-Type: application/json

{
  "home_goals": 4,
  "away_goals": 0
}
```

Standings are recalculated automatically via a database trigger. Verify:

```
GET http://localhost:8080/api/leagues/1/standings
```

---

### Step 8 — View match events (goals, cards)

```
GET http://localhost:8080/api/matches/1/events
```

---

### Step 9 — Reset the league and start over

```
DELETE http://localhost:8080/api/leagues/1/reset
```

All match results and standings are wiped. Teams remain. Fixtures are regenerated from scratch.

---

## 5. Other Useful Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/api/leagues/1/top-scorers` | Top goalscorers |
| `GET` | `/api/leagues/1/top-assists` | Top assist providers |
| `GET` | `/api/leagues/1/most-cards` | Most booked players |
| `GET` | `/api/teams/1/players` | Squad list for a team |
| `DELETE` | `/api/admin/reset` | Wipe the entire database |

Full endpoint reference: see `API.md`.

---

## 6. Run Tests

```bash
cd backend
go test ./...
```

---

## Troubleshooting

**`connection refused` on startup**
PostgreSQL is not running. Start it with `brew services start postgresql` (macOS) or `sudo systemctl start postgresql` (Linux).

**`password authentication failed`**
Check `DB_USER` and `DB_PASSWORD` in `backend/.env`.

**`relation "teams" does not exist`**
The schema was not loaded. Run:
```bash
psql -U postgres -d league -f sql/tables.sql
```

**`league already imported` on seed**
The league was already seeded. Either use a different `league_codes` value or reset the database first:
```
DELETE http://localhost:8080/api/admin/reset
```

**Predictions return 400**
At least 4 matchdays must be completed before predictions are available. Play weeks 1–4 first.
