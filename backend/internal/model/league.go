package model

import "time"

type League struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	CompetitionID *int      `json:"competition_id,omitempty"`
	Status        string    `json:"status"` // pending, active, finished
	CurrentWeek   int       `json:"current_week"`
	CreatedAt     time.Time `json:"created_at"`
}

type Competition struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Country   string    `json:"country"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateLeagueRequest struct {
	Name    string `json:"name"     binding:"required"`
	TeamIDs []int  `json:"team_ids" binding:"required,min=4"`
}

// LeagueRepository interface
type LeagueRepository interface {
	Create(league *League) error
	GetByID(id int) (*League, error)
	GetAll() ([]League, error)
	UpdateStatus(id int, status string) error
	UpdateCurrentWeek(id int, week int) error
	AddTeams(leagueID int, teamIDs []int) error
	GetTeams(leagueID int) ([]Team, error)
	Delete(id int) error
}

// LeagueService interface
type LeagueService interface {
	CreateLeague(req CreateLeagueRequest) (*League, error)
	GetLeague(id int) (*League, error)
	GetAllLeagues() ([]League, error)
	ResetLeague(id int) error
	GetStandings(leagueID int) ([]Standing, error)
	GetFixtures(leagueID int) ([]Match, error)
	GetPredictions(leagueID int) ([]Prediction, error)
}