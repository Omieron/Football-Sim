package repository

import (
	"database/sql"
	"fmt"
	"football-sim/internal/model"
)

type leagueRepository struct {
	db *sql.DB
}

func NewLeagueRepository(db *sql.DB) model.LeagueRepository {
	return &leagueRepository{db: db}
}

func (r *leagueRepository) Create(l *model.League) error {
	query := `
		INSERT INTO leagues (name, competition_id, status, current_week)
		VALUES ($1, $2, 'pending', 0)
		RETURNING id, created_at`

	return r.db.QueryRow(query, l.Name, l.CompetitionID).Scan(&l.ID, &l.CreatedAt)
}

func (r *leagueRepository) GetByID(id int) (*model.League, error) {
	query := `
		SELECT id, name, competition_id, status, current_week, created_at
		FROM leagues WHERE id = $1`

	var l model.League
	err := r.db.QueryRow(query, id).Scan(
		&l.ID, &l.Name, &l.CompetitionID, &l.Status, &l.CurrentWeek, &l.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("league not found")
	}
	return &l, err
}

func (r *leagueRepository) GetAll() ([]model.League, error) {
	query := `
		SELECT id, name, competition_id, status, current_week, created_at
		FROM leagues ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var leagues []model.League
	for rows.Next() {
		var l model.League
		if err := rows.Scan(
			&l.ID, &l.Name, &l.CompetitionID, &l.Status, &l.CurrentWeek, &l.CreatedAt,
		); err != nil {
			return nil, err
		}
		leagues = append(leagues, l)
	}
	return leagues, nil
}

func (r *leagueRepository) UpdateStatus(id int, status string) error {
	_, err := r.db.Exec(`UPDATE leagues SET status = $1 WHERE id = $2`, status, id)
	return err
}

func (r *leagueRepository) UpdateCurrentWeek(id int, week int) error {
	_, err := r.db.Exec(`UPDATE leagues SET current_week = $1 WHERE id = $2`, week, id)
	return err
}

func (r *leagueRepository) AddTeams(leagueID int, teamIDs []int) error {
	for _, tid := range teamIDs {
		_, err := r.db.Exec(
			`INSERT INTO league_teams (league_id, team_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			leagueID, tid,
		)
		if err != nil {
			return fmt.Errorf("AddTeams: %w", err)
		}
	}
	return nil
}

func (r *leagueRepository) GetTeams(leagueID int) ([]model.Team, error) {
	query := `
		SELECT t.id, t.name, t.short_name, t.crest_url, t.attack, t.defense, t.created_at
		FROM teams t
		JOIN league_teams lt ON lt.team_id = t.id
		WHERE lt.league_id = $1
		ORDER BY t.name`

	rows, err := r.db.Query(query, leagueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []model.Team
	for rows.Next() {
		var t model.Team
		if err := rows.Scan(
			&t.ID, &t.Name, &t.ShortName, &t.CrestURL,
			&t.Attack, &t.Defense, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		teams = append(teams, t)
	}
	return teams, nil
}

func (r *leagueRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM leagues WHERE id = $1`, id)
	return err
}