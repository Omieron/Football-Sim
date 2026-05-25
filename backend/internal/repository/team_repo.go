package repository

import (
	"database/sql"
	"fmt"
	"football-sim/internal/model"
)

type teamRepository struct {
	db *sql.DB
}

func NewTeamRepository(db *sql.DB) model.TeamRepository {
	return &teamRepository{db: db}
}

func (r *teamRepository) GetAll() ([]model.Team, error) {
	query := `
		SELECT t.id, t.name, t.short_name, t.crest_url, t.attack, t.defense,
		       t.competition_id, COALESCE(c.name, '') AS competition_name, t.created_at
		FROM teams t
		LEFT JOIN competitions c ON c.id = t.competition_id
		ORDER BY c.name ASC NULLS LAST, t.name ASC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("GetAll teams: %w", err)
	}
	defer rows.Close()

	var teams []model.Team
	for rows.Next() {
		var t model.Team
		if err := rows.Scan(
			&t.ID, &t.Name, &t.ShortName, &t.CrestURL,
			&t.Attack, &t.Defense, &t.CompetitionID, &t.CompetitionName, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		teams = append(teams, t)
	}
	return teams, nil
}

func (r *teamRepository) GetByID(id int) (*model.Team, error) {
	query := `
		SELECT t.id, t.name, t.short_name, t.crest_url, t.attack, t.defense,
		       t.competition_id, COALESCE(c.name, '') AS competition_name, t.created_at
		FROM teams t
		LEFT JOIN competitions c ON c.id = t.competition_id
		WHERE t.id = $1`

	var t model.Team
	err := r.db.QueryRow(query, id).Scan(
		&t.ID, &t.Name, &t.ShortName, &t.CrestURL,
		&t.Attack, &t.Defense, &t.CompetitionID, &t.CompetitionName, &t.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("team not found")
	}
	if err != nil {
		return nil, fmt.Errorf("GetByID team: %w", err)
	}
	return &t, nil
}

func (r *teamRepository) Create(t *model.Team) error {
	query := `
		INSERT INTO teams (name, short_name, crest_url, attack, defense)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`

	return r.db.QueryRow(query,
		t.Name, t.ShortName, t.CrestURL, t.Attack, t.Defense,
	).Scan(&t.ID, &t.CreatedAt)
}

func (r *teamRepository) Update(t *model.Team) error {
	query := `
		UPDATE teams
		SET name = $1, short_name = $2, crest_url = $3, attack = $4, defense = $5
		WHERE id = $6`

	res, err := r.db.Exec(query,
		t.Name, t.ShortName, t.CrestURL, t.Attack, t.Defense, t.ID,
	)
	if err != nil {
		return fmt.Errorf("Update team: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("team not found")
	}
	return nil
}

func (r *teamRepository) Delete(id int) error {
	res, err := r.db.Exec(`DELETE FROM teams WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("Delete team: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("team not found")
	}
	return nil
}