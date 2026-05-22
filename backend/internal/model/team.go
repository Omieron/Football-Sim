package model

import "time"

type Team struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	ShortName string    `json:"short_name"`
	CrestURL  string    `json:"crest_url"`
	Attack    int       `json:"attack"`
	Defense   int       `json:"defense"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateTeamRequest struct {
	Name      string `json:"name"      binding:"required"`
	ShortName string `json:"short_name"`
	CrestURL  string `json:"crest_url"`
	Attack    int    `json:"attack"    binding:"required,min=1,max=100"`
	Defense   int    `json:"defense"   binding:"required,min=1,max=100"`
}

type UpdateTeamRequest struct {
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
	CrestURL  string `json:"crest_url"`
	Attack    int    `json:"attack"    binding:"omitempty,min=1,max=100"`
	Defense   int    `json:"defense"   binding:"omitempty,min=1,max=100"`
}

// TeamRepository — interface for database operations
type TeamRepository interface {
	GetAll() ([]Team, error)
	GetByID(id int) (*Team, error)
	Create(team *Team) error
	Update(team *Team) error
	Delete(id int) error
}

// TeamService — interface for business logic
type TeamService interface {
	GetAllTeams() ([]Team, error)
	GetTeamByID(id int) (*Team, error)
	CreateTeam(req CreateTeamRequest) (*Team, error)
	UpdateTeam(id int, req UpdateTeamRequest) (*Team, error)
	DeleteTeam(id int) error
}