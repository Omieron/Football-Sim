# How to Run — Pitchline (League Simulation)

Two ways to run the project:

| Method | Best for |
|--------|----------|
| **Docker** (recommended) | Server deploy, quick demo, no local Go/Postgres install |
| **Local manual** | Active backend/frontend development |

---

## Live deployment (Case Insider)

Production instance on DigitalOcean:

| | URL |
|---|-----|
| **Web app** | https://caseinsider.omerfarukasil.me |
| **API (via domain + nginx)** | https://caseinsider.omerfarukasil.me/api/... |
| **API direct (Postman / curl)** | http://165.232.69.83:9011 |

Examples:

```
GET  https://caseinsider.omerfarukasil.me/api/leagues
GET  http://165.232.69.83:9011/health
POST http://165.232.69.83:9011/api/admin/seed
```

HTTPS is handled by **Caddy** on the host (`caseinsider.omerfarukasil.me` → `localhost:9010`). Docker still exposes **9010** (web) and **9011** (backend) for direct IP access.

---

## Quick Start with Docker

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Docker | 24+ |
| Docker Compose | v2+ |

### 1. Configure environment

From the project root:

```bash
cp .env.docker.example .env
```

Edit `.env` and set a strong password:

```env
DB_USER=postgres
DB_PASSWORD=your_strong_password_here
DB_NAME=league
HTTP_PORT=9010
BACKEND_PORT=9011
```

> **Ports:** `9010` = web UI (nginx). `9011` = API direct for Postman/curl. Adjust if your server uses a different range.

### 2. Build and start

```bash
docker compose up -d --build
```

This starts three services:

| Service | Role |
|---------|------|
| `db` | PostgreSQL 16 — schema loaded automatically from `sql/tables.sql` on first run |
| `backend` | Go API — host port `BACKEND_PORT` (default **9011**) |
| `web` | Nginx — React UI + `/api` proxy — host port `HTTP_PORT` (default **9010**) |

### 3. Open the app

**Web UI:**

```
http://YOUR_SERVER_IP:9010
```

**API direct (Postman / curl):**

```
http://YOUR_SERVER_IP:9011
```

Example: `GET http://YOUR_SERVER_IP:9011/health`

**API via nginx (same origin as UI):**

```
http://YOUR_SERVER_IP:9010/api/...
```

### 4. Seed data

1. Open the **Import** page in the UI.
2. Select a league (e.g. Premier League) and import teams/players.

Or via API (direct backend port):

```
POST http://YOUR_SERVER_IP:9011/api/admin/seed
Content-Type: application/json

{ "league_codes": ["eng.1"] }
```

### Useful Docker commands

```bash
docker compose ps                 # service status
docker compose logs -f web        # frontend/nginx logs
docker compose logs -f backend    # API logs
docker compose restart backend    # restart API after env change
docker compose down               # stop containers
docker compose down -v            # stop + delete database volume (full reset)
```

### Docker troubleshooting

**`npm ci` failed while building `web`**

Usually one of these:

1. **`package-lock.json` out of sync** — often after generating the lock on macOS while Linux Docker needs `@emnapi/core` / `@emnapi/runtime` (Tailwind/Rolldown wasm deps). Pull latest code; the repo lock file includes them. If you still see `Missing: @emnapi/... from lock file`, run locally:
   ```bash
   cd frontend && npm install && git add package-lock.json && git commit -m "fix lock file for linux docker"
   ```
2. **See the real npm error** (Docker hides it by default):
   ```bash
   docker compose build web --no-cache --progress=plain 2>&1 | tail -80
   ```
   Or on the server: `cat /root/.npm/_logs/*-debug-*.log | tail -50`
3. **Registry/network** — the server must reach `registry.npmjs.org`.

The frontend Dockerfile uses `node:22-bookworm-slim` (not Alpine) because Vite 8 / Tailwind 4 ship native Linux binaries that are more reliable on Debian.

**Port already in use**

Change `HTTP_PORT` or `BACKEND_PORT` in `.env` and run `docker compose up -d --build` again.

**`Set DB_PASSWORD in .env` error**

You copied `.env.docker.example` to `.env` but left `DB_PASSWORD` empty.

**Blank page / API errors after first boot**

Wait ~10 seconds for Postgres healthcheck, then check logs:

```bash
docker compose logs backend
```

**Schema missing / relation does not exist**

The DB volume was created before schema init. Reset and recreate:

```bash
docker compose down -v
docker compose up -d --build
```

**Play All times out**

Nginx proxy timeouts are already extended to 300s in `frontend/nginx.conf`.

---

## Local Development (Manual Setup)

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Go | 1.21+ |
| Node.js | 20+ (frontend only) |
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

## 3. Install Dependencies & Run (backend)

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

### Frontend (optional, local dev)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080` — open the URL shown in the terminal (usually `http://localhost:5173`).

---

## 4. Testing via Postman — Full Happy Path

> **Base URL**
> - **Production:** `https://caseinsider.omerfarukasil.me` or direct `http://165.232.69.83:9011`
> - Docker (Postman direct): `http://YOUR_SERVER_IP:9011`
> - Docker (via nginx): `http://YOUR_SERVER_IP:9010` — paths start with `/api/...`
> - Local backend only: `http://localhost:8080`

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

**Docker: containers exit immediately**

Run `docker compose logs db backend web` and verify `.env` has `DB_PASSWORD` set.

**Docker: cannot reach app from another machine**

Open `HTTP_PORT` and `BACKEND_PORT` in your firewall/security group (e.g. TCP 9010 and 9011).

**`connection refused` on startup (local)**
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
