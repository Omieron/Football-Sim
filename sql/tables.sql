-- ============================================================
-- INSIDER CASE — Football League Simulation
-- Full Database Schema
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLES
-- ============================================================

-- Competitions (Premier League, Championship, etc.)
CREATE TABLE competitions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,           -- "Premier League"
    code        VARCHAR(20)  NOT NULL UNIQUE,    -- "PL", "ELC" (API code)
    country     VARCHAR(100) NOT NULL DEFAULT 'England',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL UNIQUE,
    short_name     VARCHAR(20),
    crest_url      VARCHAR(255),
    attack         INT NOT NULL DEFAULT 50 CHECK (attack  BETWEEN 1 AND 100),
    defense        INT NOT NULL DEFAULT 50 CHECK (defense BETWEEN 1 AND 100),
    competition_id INT REFERENCES competitions(id) ON DELETE SET NULL,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- Players
CREATE TABLE players (
    id          SERIAL PRIMARY KEY,
    team_id     INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    position    VARCHAR(10)  NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Simulation league (created by the user)
CREATE TABLE leagues (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    competition_id  INT REFERENCES competitions(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'active', 'finished')),
    current_week    INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- League - Team relationship (which team belongs to which league)
CREATE TABLE league_teams (
    league_id   INT NOT NULL REFERENCES leagues(id)  ON DELETE CASCADE,
    team_id     INT NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
    PRIMARY KEY (league_id, team_id)
);

-- Matches
CREATE TABLE matches (
    id              SERIAL PRIMARY KEY,
    league_id       INT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week            INT NOT NULL CHECK (week > 0),
    home_team_id    INT NOT NULL REFERENCES teams(id),
    away_team_id    INT NOT NULL REFERENCES teams(id),
    home_goals      INT NOT NULL DEFAULT 0 CHECK (home_goals >= 0),
    away_goals      INT NOT NULL DEFAULT 0 CHECK (away_goals >= 0),
    played          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    CHECK (home_team_id <> away_team_id)
);

-- Match events (goal, own goal, cards)
CREATE TABLE match_events (
    id                  SERIAL PRIMARY KEY,
    match_id            INT NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
    player_id           INT          REFERENCES players(id)  ON DELETE SET NULL,
    assist_player_id    INT          REFERENCES players(id)  ON DELETE SET NULL,
    assist_player_name  VARCHAR(100),
    team_id             INT NOT NULL REFERENCES teams(id),
    type                VARCHAR(20)  NOT NULL CHECK (type IN ('goal', 'own_goal', 'yellow_card', 'red_card')),
    minute              INT NOT NULL CHECK (minute BETWEEN 1 AND 120),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Standings (separate table — automatically updated by trigger)
CREATE TABLE standings (
    id              SERIAL PRIMARY KEY,
    league_id       INT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id         INT NOT NULL REFERENCES teams(id)   ON DELETE CASCADE,
    played          INT NOT NULL DEFAULT 0,
    won             INT NOT NULL DEFAULT 0,
    drawn           INT NOT NULL DEFAULT 0,
    lost            INT NOT NULL DEFAULT 0,
    goals_for       INT NOT NULL DEFAULT 0,
    goals_against   INT NOT NULL DEFAULT 0,
    goal_diff       INT GENERATED ALWAYS AS (goals_for - goals_against) STORED,
    points          INT GENERATED ALWAYS AS (won * 3 + drawn) STORED,
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (league_id, team_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_matches_league_week    ON matches(league_id, week);
CREATE INDEX idx_matches_played         ON matches(league_id, played);
CREATE INDEX idx_match_events_match     ON match_events(match_id);
CREATE INDEX idx_match_events_player    ON match_events(player_id);
CREATE INDEX idx_standings_league       ON standings(league_id, points DESC, goal_diff DESC);
CREATE INDEX idx_players_team           ON players(team_id);
CREATE INDEX idx_teams_name             ON teams(name);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Automatically update standings when a match is played
CREATE OR REPLACE FUNCTION update_standings()
RETURNS TRIGGER AS $$
DECLARE
    home_won  BOOLEAN;
    away_won  BOOLEAN;
    is_draw   BOOLEAN;
BEGIN
    IF NEW.played = FALSE THEN
        RETURN NEW;
    END IF;

    home_won := NEW.home_goals > NEW.away_goals;
    away_won := NEW.away_goals > NEW.home_goals;
    is_draw  := NEW.home_goals = NEW.away_goals;

    -- Home team
    INSERT INTO standings (league_id, team_id, played, won, drawn, lost, goals_for, goals_against)
    VALUES (
        NEW.league_id, NEW.home_team_id, 1,
        CASE WHEN home_won THEN 1 ELSE 0 END,
        CASE WHEN is_draw  THEN 1 ELSE 0 END,
        CASE WHEN away_won THEN 1 ELSE 0 END,
        NEW.home_goals, NEW.away_goals
    )
    ON CONFLICT (league_id, team_id) DO UPDATE SET
        played        = standings.played        + 1,
        won           = standings.won           + CASE WHEN home_won THEN 1 ELSE 0 END,
        drawn         = standings.drawn         + CASE WHEN is_draw  THEN 1 ELSE 0 END,
        lost          = standings.lost          + CASE WHEN away_won THEN 1 ELSE 0 END,
        goals_for     = standings.goals_for     + NEW.home_goals,
        goals_against = standings.goals_against + NEW.away_goals,
        updated_at    = NOW();

    -- Away team
    INSERT INTO standings (league_id, team_id, played, won, drawn, lost, goals_for, goals_against)
    VALUES (
        NEW.league_id, NEW.away_team_id, 1,
        CASE WHEN away_won THEN 1 ELSE 0 END,
        CASE WHEN is_draw  THEN 1 ELSE 0 END,
        CASE WHEN home_won THEN 1 ELSE 0 END,
        NEW.away_goals, NEW.home_goals
    )
    ON CONFLICT (league_id, team_id) DO UPDATE SET
        played        = standings.played        + 1,
        won           = standings.won           + CASE WHEN away_won THEN 1 ELSE 0 END,
        drawn         = standings.drawn         + CASE WHEN is_draw  THEN 1 ELSE 0 END,
        lost          = standings.lost          + CASE WHEN home_won THEN 1 ELSE 0 END,
        goals_for     = standings.goals_for     + NEW.away_goals,
        goals_against = standings.goals_against + NEW.home_goals,
        updated_at    = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_standings
AFTER UPDATE OF played ON matches
FOR EACH ROW
WHEN (OLD.played = FALSE AND NEW.played = TRUE)
EXECUTE FUNCTION update_standings();


-- Recalculate standings when score is manually edited
CREATE OR REPLACE FUNCTION recalculate_standings_on_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.played = FALSE THEN
        RETURN NEW;
    END IF;

    IF OLD.home_goals = NEW.home_goals AND OLD.away_goals = NEW.away_goals THEN
        RETURN NEW;
    END IF;

    -- Revert old result
    UPDATE standings SET
        played        = played        - 1,
        won           = won           - CASE WHEN OLD.home_goals > OLD.away_goals THEN 1 ELSE 0 END,
        drawn         = drawn         - CASE WHEN OLD.home_goals = OLD.away_goals THEN 1 ELSE 0 END,
        lost          = lost          - CASE WHEN OLD.home_goals < OLD.away_goals THEN 1 ELSE 0 END,
        goals_for     = goals_for     - OLD.home_goals,
        goals_against = goals_against - OLD.away_goals,
        updated_at    = NOW()
    WHERE league_id = OLD.league_id AND team_id = OLD.home_team_id;

    UPDATE standings SET
        played        = played        - 1,
        won           = won           - CASE WHEN OLD.away_goals > OLD.home_goals THEN 1 ELSE 0 END,
        drawn         = drawn         - CASE WHEN OLD.home_goals = OLD.away_goals THEN 1 ELSE 0 END,
        lost          = lost          - CASE WHEN OLD.away_goals < OLD.home_goals THEN 1 ELSE 0 END,
        goals_for     = goals_for     - OLD.away_goals,
        goals_against = goals_against - OLD.home_goals,
        updated_at    = NOW()
    WHERE league_id = OLD.league_id AND team_id = OLD.away_team_id;

    -- Apply new result
    UPDATE standings SET
        played        = played        + 1,
        won           = won           + CASE WHEN NEW.home_goals > NEW.away_goals THEN 1 ELSE 0 END,
        drawn         = drawn         + CASE WHEN NEW.home_goals = NEW.away_goals THEN 1 ELSE 0 END,
        lost          = lost          + CASE WHEN NEW.home_goals < NEW.away_goals THEN 1 ELSE 0 END,
        goals_for     = goals_for     + NEW.home_goals,
        goals_against = goals_against + NEW.away_goals,
        updated_at    = NOW()
    WHERE league_id = NEW.league_id AND team_id = NEW.home_team_id;

    UPDATE standings SET
        played        = played        + 1,
        won           = won           + CASE WHEN NEW.away_goals > NEW.home_goals THEN 1 ELSE 0 END,
        drawn         = drawn         + CASE WHEN NEW.home_goals = NEW.away_goals THEN 1 ELSE 0 END,
        lost          = lost          + CASE WHEN NEW.away_goals < NEW.home_goals THEN 1 ELSE 0 END,
        goals_for     = goals_for     + NEW.away_goals,
        goals_against = goals_against + NEW.home_goals,
        updated_at    = NOW()
    WHERE league_id = NEW.league_id AND team_id = NEW.away_team_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_standings
AFTER UPDATE OF home_goals, away_goals ON matches
FOR EACH ROW
EXECUTE FUNCTION recalculate_standings_on_edit();


-- ============================================================
-- VIEWS
-- ============================================================

-- Standings (Premier League ranking rules)
CREATE OR REPLACE VIEW v_standings AS
SELECT
    s.league_id,
    s.team_id,
    t.name          AS team_name,
    t.short_name,
    t.crest_url,
    s.played,
    s.won,
    s.drawn,
    s.lost,
    s.goals_for,
    s.goals_against,
    s.goal_diff,
    s.points,
    s.updated_at
FROM standings s
JOIN teams t ON t.id = s.team_id
ORDER BY s.points DESC, s.goal_diff DESC, s.goals_for DESC;


-- Weekly matches
CREATE OR REPLACE VIEW v_week_matches AS
SELECT
    m.id            AS match_id,
    m.league_id,
    m.week,
    m.played,
    m.home_goals,
    m.away_goals,
    ht.id           AS home_team_id,
    ht.name         AS home_team_name,
    ht.crest_url    AS home_crest_url,
    at.id           AS away_team_id,
    at.name         AS away_team_name,
    at.crest_url    AS away_crest_url
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id;


-- Match events
CREATE OR REPLACE VIEW v_match_events AS
SELECT
    me.id,
    me.match_id,
    me.type,
    me.minute,
    me.team_id,
    t.name          AS team_name,
    me.player_id,
    p.name          AS player_name,
    p.position
FROM match_events me
JOIN teams   t ON t.id = me.team_id
LEFT JOIN players p ON p.id = me.player_id
ORDER BY me.minute ASC;


-- Top scorers
CREATE OR REPLACE VIEW v_top_scorers AS
SELECT
    me.player_id,
    p.name          AS player_name,
    p.position,
    t.id            AS team_id,
    t.name          AS team_name,
    m.league_id,
    COUNT(*)        AS goals
FROM match_events me
JOIN players p ON p.id = me.player_id
JOIN teams   t ON t.id = me.team_id
JOIN matches m ON m.id = me.match_id
WHERE me.type = 'goal'
GROUP BY me.player_id, p.name, p.position, t.id, t.name, m.league_id
ORDER BY goals DESC;


-- Most carded players
CREATE OR REPLACE VIEW v_most_cards AS
SELECT
    me.player_id,
    p.name          AS player_name,
    t.name          AS team_name,
    m.league_id,
    COUNT(*) FILTER (WHERE me.type = 'yellow_card') AS yellow_cards,
    COUNT(*) FILTER (WHERE me.type = 'red_card')    AS red_cards,
    COUNT(*) FILTER (WHERE me.type IN ('yellow_card','red_card')) AS total_cards
FROM match_events me
JOIN players p ON p.id = me.player_id
JOIN teams   t ON t.id = me.team_id
JOIN matches m ON m.id = me.match_id
GROUP BY me.player_id, p.name, t.name, m.league_id
ORDER BY total_cards DESC;


