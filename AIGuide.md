# AI Usage Guide

This document explains how AI (Claude) was used throughout the development of this project.
The collaboration model was consistent: **I made every architectural, algorithmic, and design
decision — AI translated those decisions into working code.**

---

## Collaboration Model

I directed what to build and how. AI handled the implementation — writing boilerplate,
translating logic into Go/SQL/JSX, catching syntax errors, and keeping the codebase consistent.
No AI decision was accepted without my review. If something didn't match what I had in mind,
I corrected the direction and AI revised.

---

## Backend Architecture

**My decisions:**
- Layer the backend as model → repository → service → handler (clean architecture)
- Define all repositories and services as Go interfaces so implementations stay swappable
- Use struct composition to wire dependencies into service structs via constructor injection
- Store all domain types in a single `model` package so interfaces and structs live together

**AI's role:**
Generated the nine interface definitions (`LeagueRepository`, `MatchRepository`,
`MatchEventRepository`, `StandingRepository`, `PlayerRepository`, `TeamRepository`,
`LeagueService`, `MatchService`, `TeamService`), wrote all struct implementations,
and wired everything together in `cmd/main.go`.

---

## Database Schema

**My decisions:**
- Which tables are needed and how they relate (competitions → teams → players, leagues → matches → events → standings)
- Use a PostgreSQL trigger to update standings automatically when a match is marked as played, so the application layer never needs to calculate points manually
- Use a second trigger to revert + reapply standings when a score is manually edited
- Compute `goal_diff` and `points` as generated columns so they're always consistent
- Add views (`v_standings`, `v_week_matches`, `v_top_scorers`, `v_most_cards`) for reusable queries

**AI's role:**
Wrote the full DDL, both trigger functions in PL/pgSQL, all views, and the index definitions
without syntax errors.

---

## Match Simulation Algorithm

**My decisions:**
- Base goal expectation on each team's `attack` and `defense` ratings (1–100 scale)
- Use a Poisson distribution to sample the number of goals — realistic because real football
  goal counts follow a Poisson process
- Scale the Poisson lambda from the rating differential so stronger teams score more on average
- Add an extra-time / penalty mechanic for cup-style ties (applied probabilistically)
- Generate per-minute match events (goals, own goals, yellow/red cards, offsides,
  substitutions, VAR cancellations) with minutes distributed realistically across 90 minutes
- Assign goals and assists to real players from the team's squad, weighted by position

**AI's role:**
Implemented `SimulateMatch`, `SimulateMatchDetailed`, `GenerateMatchEvents`, and
`MaybeApplyExtraTime` in Go. Handled all the random sampling, edge cases, and player
assignment logic.

---

## Championship Prediction Engine

**My decisions:**
- Use Monte Carlo simulation (1000 runs) rather than a simple points-extrapolation formula
- Each simulation run plays all remaining fixtures using the same Poisson engine
- Count how many times each team finishes first across all runs → percentage is the probability
- Only activate predictions after matchday 4, matching the case requirement

**AI's role:**
Implemented `Predict`, `updateSimStandings`, and `findChampion` in `service/prediction.go`.

---

## Fixture Generation

**My decisions:**
- Double round-robin (each team plays every other team twice — once home, once away)
- Use the standard round-robin rotation algorithm: fix the first team, rotate the rest
- Schedule two matches per matchday for a 4-team league (both games played simultaneously)

**AI's role:**
Implemented `GenerateFixtures` and `rotateTeams`, wrote the test in `fixture_test.go`
that validates correct match counts, week counts, and pairing symmetry for 4, 18, and 20-team leagues.

---

## Play All — Week-by-Week Results

**My decision:**
`POST /api/leagues/:id/play-all` should not just return a success message — it should return
every week's matches grouped by matchday so callers can see the full season results in one response.

**AI's role:**
Added the `WeekResult` type, updated the `MatchService` interface, revised `PlayAll` to collect
results per week, and updated the handler to include `data` in the response.

---

## Team Strength Ratings

**My decision:**
Import real teams from the ESPN API and assign realistic attack/defense ratings based on
actual club quality rather than random or alphabetical values.

**AI's role:**
Built the ESPN scraper (teams + full rosters), wrote the `LookupTeamRating` table covering
~150 clubs across 10 leagues, and implemented the upsert-based seeder so re-running never
creates duplicates.

---

## Frontend

**My decisions:**
- Editorial dark theme: cream/acid/pink color tokens, Space Grotesk typeface, grain overlay
- Dashboard layout: standings on the left, match carousel + stats rotator + predictions on the right
- Stats rotator cycles between top scorers, top assists, and discipline leaderboard on a 5-second timer
- Match carousel shows one matchday at a time with ‹/› navigation across all weeks
- Live match modal with half-time break, extra-time indicator, and minute-by-minute event feed
- Goal replay: dot-pitch animation with keyframe data persisted at simulation time
- Fixtures page: sticky week navigation, match cards grouped by matchday

**AI's role:**
Built all React components and pages (Dashboard, Fixtures, Stats, Teams, NewLeague, Import),
implemented the carousel, rotator, live modal, and goal replay animation, and kept the design
system consistent across the codebase.

---

## Documentation

**My decision:**
The project needs two documents: a Postman-ready API reference and a setup guide detailed
enough that anyone can run the project without asking questions.

**AI's role:**
Wrote `API.md` (full endpoint reference with request/response examples, error codes, and
recommended test order) and `HowToRun.md` (prerequisites, DB setup, env config, server startup,
9-step Postman happy path, troubleshooting section).
