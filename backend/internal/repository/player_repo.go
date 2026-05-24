package repository

import (
	"database/sql"
	"fmt"
	"football-sim/internal/model"
)

type playerRepository struct {
	db *sql.DB
}

func NewPlayerRepository(db *sql.DB) model.PlayerRepository {
	return &playerRepository{db: db}
}

func (r *playerRepository) GetByTeamID(teamID int) ([]model.Player, error) {
	query := `
		SELECT id, team_id, name, position, created_at
		FROM players WHERE team_id = $1
		ORDER BY position, name`

	rows, err := r.db.Query(query, teamID)
	if err != nil {
		return nil, fmt.Errorf("GetByTeamID players: %w", err)
	}
	defer rows.Close()

	var players []model.Player
	for rows.Next() {
		var p model.Player
		if err := rows.Scan(&p.ID, &p.TeamID, &p.Name, &p.Position, &p.CreatedAt); err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, nil
}

func (r *playerRepository) GetByID(id int) (*model.Player, error) {
	query := `SELECT id, team_id, name, position, created_at FROM players WHERE id = $1`
	var p model.Player
	err := r.db.QueryRow(query, id).Scan(&p.ID, &p.TeamID, &p.Name, &p.Position, &p.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("player not found")
	}
	return &p, err
}

func (r *playerRepository) Create(p *model.Player) error {
	query := `
		INSERT INTO players (team_id, name, position)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`

	return r.db.QueryRow(query, p.TeamID, p.Name, p.Position).Scan(&p.ID, &p.CreatedAt)
}

func (r *playerRepository) Delete(id int) error {
	res, err := r.db.Exec(`DELETE FROM players WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("Delete player: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("player not found")
	}
	return nil
}

func (r *playerRepository) GetRandomByTeamID(teamID int) (*model.Player, error) {
	query := `
		SELECT id, team_id, name, position, created_at
		FROM players WHERE team_id = $1
		ORDER BY RANDOM() LIMIT 1`

	var p model.Player
	err := r.db.QueryRow(query, teamID).Scan(&p.ID, &p.TeamID, &p.Name, &p.Position, &p.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, err
}