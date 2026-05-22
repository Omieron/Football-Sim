package model

import "time"

type Player struct {
	ID        int       `json:"id"`
	TeamID    int       `json:"team_id"`
	Name      string    `json:"name"`
	Position  string    `json:"position"` // GK, DEF, MID, FWD
	CreatedAt time.Time `json:"created_at"`
}

type CreatePlayerRequest struct {
	Name     string `json:"name"     binding:"required"`
	Position string `json:"position" binding:"required,oneof=GK DEF MID FWD"`
}

// PlayerRepository interface
type PlayerRepository interface {
	GetByTeamID(teamID int) ([]Player, error)
	GetByID(id int) (*Player, error)
	Create(player *Player) error
	Delete(id int) error
	GetRandomByTeamID(teamID int) (*Player, error)
}