package service

import (
	"fmt"
	"football-sim/internal/model"
)

type leagueService struct {
	leagueRepo  model.LeagueRepository
	matchRepo   model.MatchRepository
	eventRepo   model.MatchEventRepository
	standingRepo model.StandingRepository
	playerRepo  model.PlayerRepository
}

func NewLeagueService(
	leagueRepo model.LeagueRepository,
	matchRepo model.MatchRepository,
	eventRepo model.MatchEventRepository,
	standingRepo model.StandingRepository,
	playerRepo model.PlayerRepository,
) model.LeagueService {
	return &leagueService{
		leagueRepo:   leagueRepo,
		matchRepo:    matchRepo,
		eventRepo:    eventRepo,
		standingRepo: standingRepo,
		playerRepo:   playerRepo,
	}
}

func (s *leagueService) CreateLeague(req model.CreateLeagueRequest) (*model.League, error) {
	if len(req.TeamIDs) < 4 {
		return nil, fmt.Errorf("en az 4 takım gerekli")
	}

	// Create league
	league := &model.League{Name: req.Name}
	if err := s.leagueRepo.Create(league); err != nil {
		return nil, fmt.Errorf("lig oluşturulamadı: %w", err)
	}

	// Add teams
	if err := s.leagueRepo.AddTeams(league.ID, req.TeamIDs); err != nil {
		return nil, fmt.Errorf("takımlar eklenemedi: %w", err)
	}

	// Initialize standings
	if err := s.standingRepo.InitForLeague(league.ID, req.TeamIDs); err != nil {
		return nil, fmt.Errorf("standings başlatılamadı: %w", err)
	}

	// Fetch teams
	teams, err := s.leagueRepo.GetTeams(league.ID)
	if err != nil {
		return nil, err
	}

	// Generate fixtures
	matches := GenerateFixtures(league.ID, teams)
	if err := s.matchRepo.CreateBatch(matches); err != nil {
		return nil, fmt.Errorf("fikstür oluşturulamadı: %w", err)
	}

	// Set league status to active
	if err := s.leagueRepo.UpdateStatus(league.ID, "active"); err != nil {
		return nil, err
	}
	league.Status = "active"

	return league, nil
}

func (s *leagueService) GetLeague(id int) (*model.League, error) {
	return s.leagueRepo.GetByID(id)
}

func (s *leagueService) GetAllLeagues() ([]model.League, error) {
	return s.leagueRepo.GetAll()
}

func (s *leagueService) ResetLeague(id int) error {
	if err := s.matchRepo.DeleteByLeagueID(id); err != nil {
		return err
	}
	if err := s.standingRepo.DeleteByLeagueID(id); err != nil {
		return err
	}

	// Re-fetch teams and rebuild standings and fixtures
	teams, err := s.leagueRepo.GetTeams(id)
	if err != nil {
		return err
	}

	teamIDs := make([]int, len(teams))
	for i, t := range teams {
		teamIDs[i] = t.ID
	}

	if err := s.standingRepo.InitForLeague(id, teamIDs); err != nil {
		return err
	}

	matches := GenerateFixtures(id, teams)
	if err := s.matchRepo.CreateBatch(matches); err != nil {
		return err
	}

	return s.leagueRepo.UpdateCurrentWeek(id, 0)
}

func (s *leagueService) GetStandings(leagueID int) ([]model.Standing, error) {
	return s.standingRepo.GetByLeagueID(leagueID)
}

func (s *leagueService) GetFixtures(leagueID int) ([]model.Match, error) {
	return s.matchRepo.GetByLeagueID(leagueID)
}

func (s *leagueService) GetPredictions(leagueID int) ([]model.Prediction, error) {
	league, err := s.leagueRepo.GetByID(leagueID)
	if err != nil {
		return nil, err
	}

	// No predictions before week 4
	if league.CurrentWeek < 4 {
		return nil, fmt.Errorf("tahmin için en az 4 hafta oynanmalı")
	}

	standings, err := s.standingRepo.GetByLeagueID(leagueID)
	if err != nil {
		return nil, err
	}

	// Find remaining matches
	unplayedWeeks, err := s.matchRepo.GetUnplayedWeeks(leagueID)
	if err != nil {
		return nil, err
	}

	var remaining []model.Match
	for _, w := range unplayedWeeks {
		wMatches, err := s.matchRepo.GetByLeagueAndWeek(leagueID, w)
		if err != nil {
			return nil, err
		}
		remaining = append(remaining, wMatches...)
	}

	teams, err := s.leagueRepo.GetTeams(leagueID)
	if err != nil {
		return nil, err
	}

	return Predict(standings, remaining, teams), nil
}