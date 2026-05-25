package repository

import (
	"database/sql"
	"fmt"
	"football-sim/config"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewDB(cfg *config.Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_type_check;
		ALTER TABLE match_events ADD CONSTRAINT match_events_type_check CHECK (type IN (
			'goal', 'own_goal', 'yellow_card', 'red_card',
			'offside', 'substitution', 'var_cancelled_goal', 'injury'
		));
	`)
	return err
}