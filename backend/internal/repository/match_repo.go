package repository

import (
	"database/sql"
	"fmt"
	"football-sim/internal/model"
)

type matchRepository struct {
	db *sql.DB
}

func NewMatchRepository(db *sql.DB) model.MatchRepository {
	return &matchRepository{db: db}
}

func (r *matchRepository) GetByID(id int) (*model.Match, error) {
	query := `
		SELECT m.id, m.league_id, m.week, m.played, m.home_goals, m.away_goals,
		       ht.id, ht.name, ht.crest_url,
		       at.id, at.name, at.crest_url,
		       m.created_at
		FROM matches m
		JOIN teams ht ON ht.id = m.home_team_id
		JOIN teams at ON at.id = m.away_team_id
		WHERE m.id = $1`

	var m model.Match
	err := r.db.QueryRow(query, id).Scan(
		&m.ID, &m.LeagueID, &m.Week, &m.Played, &m.HomeGoals, &m.AwayGoals,
		&m.HomeTeamID, &m.HomeTeamName, &m.HomeCrestURL,
		&m.AwayTeamID, &m.AwayTeamName, &m.AwayCrestURL,
		&m.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("match not found")
	}
	return &m, err
}

func (r *matchRepository) GetByLeagueAndWeek(leagueID, week int) ([]model.Match, error) {
	query := `
		SELECT m.id, m.league_id, m.week, m.played, m.home_goals, m.away_goals,
		       ht.id, ht.name, ht.crest_url,
		       at.id, at.name, at.crest_url,
		       m.created_at
		FROM matches m
		JOIN teams ht ON ht.id = m.home_team_id
		JOIN teams at ON at.id = m.away_team_id
		WHERE m.league_id = $1 AND m.week = $2
		ORDER BY m.id`

	return r.scanMatches(query, leagueID, week)
}

func (r *matchRepository) GetByLeagueID(leagueID int) ([]model.Match, error) {
	query := `
		SELECT m.id, m.league_id, m.week, m.played, m.home_goals, m.away_goals,
		       ht.id, ht.name, ht.crest_url,
		       at.id, at.name, at.crest_url,
		       m.created_at
		FROM matches m
		JOIN teams ht ON ht.id = m.home_team_id
		JOIN teams at ON at.id = m.away_team_id
		WHERE m.league_id = $1
		ORDER BY m.week, m.id`

	return r.scanMatches(query, leagueID)
}

func (r *matchRepository) scanMatches(query string, args ...any) ([]model.Match, error) {
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("scanMatches: %w", err)
	}
	defer rows.Close()

	var matches []model.Match
	for rows.Next() {
		var m model.Match
		if err := rows.Scan(
			&m.ID, &m.LeagueID, &m.Week, &m.Played, &m.HomeGoals, &m.AwayGoals,
			&m.HomeTeamID, &m.HomeTeamName, &m.HomeCrestURL,
			&m.AwayTeamID, &m.AwayTeamName, &m.AwayCrestURL,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		matches = append(matches, m)
	}
	return matches, nil
}

func (r *matchRepository) CreateBatch(matches []model.Match) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO matches (league_id, week, home_team_id, away_team_id)
		VALUES ($1, $2, $3, $4)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, m := range matches {
		if _, err := stmt.Exec(m.LeagueID, m.Week, m.HomeTeamID, m.AwayTeamID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *matchRepository) UpdateScore(id, homeGoals, awayGoals int) error {
	_, err := r.db.Exec(
		`UPDATE matches SET home_goals = $1, away_goals = $2 WHERE id = $3`,
		homeGoals, awayGoals, id,
	)
	return err
}

func (r *matchRepository) MarkPlayed(id int) error {
	_, err := r.db.Exec(`UPDATE matches SET played = TRUE WHERE id = $1`, id)
	return err
}

func (r *matchRepository) DeleteByLeagueID(leagueID int) error {
	_, err := r.db.Exec(`DELETE FROM matches WHERE league_id = $1`, leagueID)
	return err
}

func (r *matchRepository) GetUnplayedWeeks(leagueID int) ([]int, error) {
	query := `
		SELECT DISTINCT week FROM matches
		WHERE league_id = $1 AND played = FALSE
		ORDER BY week ASC`

	rows, err := r.db.Query(query, leagueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var weeks []int
	for rows.Next() {
		var w int
		if err := rows.Scan(&w); err != nil {
			return nil, err
		}
		weeks = append(weeks, w)
	}
	return weeks, nil
}

// ─── Match Event Repository ──────────────────────────────────────────────────

type matchEventRepository struct {
	db *sql.DB
}

func NewMatchEventRepository(db *sql.DB) model.MatchEventRepository {
	return &matchEventRepository{db: db}
}

func (r *matchEventRepository) GetByMatchID(matchID int) ([]model.MatchEvent, error) {
	query := `
		SELECT me.id, me.match_id, me.player_id, COALESCE(p.name,''), COALESCE(p.position,''),
		       me.team_id, t.name, me.type, me.minute, me.created_at
		FROM match_events me
		JOIN teams t ON t.id = me.team_id
		LEFT JOIN players p ON p.id = me.player_id
		WHERE me.match_id = $1
		ORDER BY me.minute ASC`

	rows, err := r.db.Query(query, matchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []model.MatchEvent
	for rows.Next() {
		var e model.MatchEvent
		if err := rows.Scan(
			&e.ID, &e.MatchID, &e.PlayerID, &e.PlayerName, &e.Position,
			&e.TeamID, &e.TeamName, &e.Type, &e.Minute, &e.CreatedAt,
		); err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

func (r *matchEventRepository) CreateBatch(events []model.MatchEvent) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO match_events (match_id, player_id, team_id, type, minute)
		VALUES ($1, $2, $3, $4, $5)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, e := range events {
		if _, err := stmt.Exec(e.MatchID, e.PlayerID, e.TeamID, e.Type, e.Minute); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *matchEventRepository) DeleteByMatchID(matchID int) error {
	_, err := r.db.Exec(`DELETE FROM match_events WHERE match_id = $1`, matchID)
	return err
}

func (r *matchEventRepository) GetTopScorers(leagueID int, limit int) ([]model.TopScorer, error) {
	query := `
		SELECT p.name, t.name, COALESCE(t.crest_url,''), COUNT(*) as goals
		FROM match_events me
		JOIN matches m  ON m.id  = me.match_id
		JOIN teams   t  ON t.id  = me.team_id
		JOIN players p  ON p.id  = me.player_id
		WHERE m.league_id = $1 AND me.type = 'goal'
		GROUP BY p.name, t.name, t.crest_url
		ORDER BY goals DESC
		LIMIT $2`

	rows, err := r.db.Query(query, leagueID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scorers []model.TopScorer
	for rows.Next() {
		var s model.TopScorer
		if err := rows.Scan(&s.PlayerName, &s.TeamName, &s.CrestURL, &s.Goals); err != nil {
			return nil, err
		}
		scorers = append(scorers, s)
	}
	return scorers, nil
}