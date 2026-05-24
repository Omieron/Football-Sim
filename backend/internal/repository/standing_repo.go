package repository

import (
	"database/sql"
	"football-sim/internal/model"
)

type standingRepository struct {
	db *sql.DB
}

func NewStandingRepository(db *sql.DB) model.StandingRepository {
	return &standingRepository{db: db}
}

func (r *standingRepository) GetByLeagueID(leagueID int) ([]model.Standing, error) {
	query := `
		SELECT s.league_id, s.team_id, t.name, t.short_name, t.crest_url,
		       s.played, s.won, s.drawn, s.lost,
		       s.goals_for, s.goals_against, s.goal_diff, s.points, s.updated_at
		FROM standings s
		JOIN teams t ON t.id = s.team_id
		WHERE s.league_id = $1
		ORDER BY s.points DESC, s.goal_diff DESC, s.goals_for DESC`

	rows, err := r.db.Query(query, leagueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var standings []model.Standing
	for rows.Next() {
		var s model.Standing
		if err := rows.Scan(
			&s.LeagueID, &s.TeamID, &s.TeamName, &s.ShortName, &s.CrestURL,
			&s.Played, &s.Won, &s.Drawn, &s.Lost,
			&s.GoalsFor, &s.GoalsAgainst, &s.GoalDiff, &s.Points, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		standings = append(standings, s)
	}
	return standings, nil
}

func (r *standingRepository) InitForLeague(leagueID int, teamIDs []int) error {
	for _, tid := range teamIDs {
		_, err := r.db.Exec(`
			INSERT INTO standings (league_id, team_id)
			VALUES ($1, $2)
			ON CONFLICT (league_id, team_id) DO NOTHING`,
			leagueID, tid,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *standingRepository) DeleteByLeagueID(leagueID int) error {
	_, err := r.db.Exec(`DELETE FROM standings WHERE league_id = $1`, leagueID)
	return err
}

// GetByLeagueIDAsMap — simülasyon için takım bazlı hızlı erişim
func (r *standingRepository) GetByLeagueIDAsMap(leagueID int) (map[int]model.Standing, error) {
	standings, err := r.GetByLeagueID(leagueID)
	if err != nil {
		return nil, err
	}

	result := make(map[int]model.Standing)
	for _, s := range standings {
		result[s.TeamID] = s
	}
	return result, nil
}

// UpdateStanding — manuel standing güncelleme (trigger yoksa fallback)
func (r *standingRepository) UpdateStanding(s model.Standing) error {
	query := `
		UPDATE standings SET
			played        = $1,
			won           = $2,
			drawn         = $3,
			lost          = $4,
			goals_for     = $5,
			goals_against = $6,
			updated_at    = NOW()
		WHERE league_id = $7 AND team_id = $8`

	_, err := r.db.Exec(query,
		s.Played, s.Won, s.Drawn, s.Lost,
		s.GoalsFor, s.GoalsAgainst,
		s.LeagueID, s.TeamID,
	)
	return err
}