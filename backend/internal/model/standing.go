package model

import "time"

type Standing struct {
	LeagueID     int       `json:"league_id"`
	TeamID       int       `json:"team_id"`
	TeamName     string    `json:"team_name"`
	ShortName    string    `json:"short_name"`
	CrestURL     string    `json:"crest_url"`
	Played       int       `json:"played"`
	Won          int       `json:"won"`
	Drawn        int       `json:"drawn"`
	Lost         int       `json:"lost"`
	GoalsFor     int       `json:"goals_for"`
	GoalsAgainst int       `json:"goals_against"`
	GoalDiff     int       `json:"goal_diff"`
	Points       int       `json:"points"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Prediction struct {
	TeamID     int     `json:"team_id"`
	TeamName   string  `json:"team_name"`
	CrestURL   string  `json:"crest_url"`
	Percentage float64 `json:"percentage"` // Monte Carlo simulation result
}

// StandingRepository interface
type StandingRepository interface {
	GetByLeagueID(leagueID int) ([]Standing, error)
	InitForLeague(leagueID int, teamIDs []int) error
	DeleteByLeagueID(leagueID int) error
}