package service

import (
	"fmt"
	"football-sim/internal/model"
)

type teamService struct {
	teamRepo model.TeamRepository
}

func NewTeamService(teamRepo model.TeamRepository) model.TeamService {
	return &teamService{teamRepo: teamRepo}
}

func (s *teamService) GetAllTeams() ([]model.Team, error) {
	return s.teamRepo.GetAll()
}

func (s *teamService) GetTeamByID(id int) (*model.Team, error) {
	return s.teamRepo.GetByID(id)
}

func (s *teamService) CreateTeam(req model.CreateTeamRequest) (*model.Team, error) {
	team := &model.Team{
		Name:      req.Name,
		ShortName: req.ShortName,
		CrestURL:  req.CrestURL,
		Attack:    req.Attack,
		Defense:   req.Defense,
	}
	if err := s.teamRepo.Create(team); err != nil {
		return nil, fmt.Errorf("takım oluşturulamadı: %w", err)
	}
	return team, nil
}

func (s *teamService) UpdateTeam(id int, req model.UpdateTeamRequest) (*model.Team, error) {
	team, err := s.teamRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		team.Name = req.Name
	}
	if req.ShortName != "" {
		team.ShortName = req.ShortName
	}
	if req.CrestURL != "" {
		team.CrestURL = req.CrestURL
	}
	if req.Attack != 0 {
		team.Attack = req.Attack
	}
	if req.Defense != 0 {
		team.Defense = req.Defense
	}

	if err := s.teamRepo.Update(team); err != nil {
		return nil, err
	}
	return team, nil
}

func (s *teamService) DeleteTeam(id int) error {
	return s.teamRepo.Delete(id)
}