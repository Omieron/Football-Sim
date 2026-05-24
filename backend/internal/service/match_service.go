package service

import (
	"fmt"
	"football-sim/internal/model"
)

type matchService struct {
	matchRepo    model.MatchRepository
	eventRepo    model.MatchEventRepository
	leagueRepo   model.LeagueRepository
	playerRepo   model.PlayerRepository
	teamRepo     model.TeamRepository
}

func NewMatchService(
	matchRepo model.MatchRepository,
	eventRepo model.MatchEventRepository,
	leagueRepo model.LeagueRepository,
	playerRepo model.PlayerRepository,
	teamRepo model.TeamRepository,
) model.MatchService {
	return &matchService{
		matchRepo:  matchRepo,
		eventRepo:  eventRepo,
		leagueRepo: leagueRepo,
		playerRepo: playerRepo,
		teamRepo:   teamRepo,
	}
}

func (s *matchService) GetWeekMatches(leagueID, week int) ([]model.Match, error) {
	matches, err := s.matchRepo.GetByLeagueAndWeek(leagueID, week)
	if err != nil {
		return nil, err
	}

	// Attach events to each match
	for i, m := range matches {
		events, err := s.eventRepo.GetByMatchID(m.ID)
		if err != nil {
			return nil, err
		}
		matches[i].Events = events
	}
	return matches, nil
}

func (s *matchService) PlayWeek(leagueID, week int) ([]model.Match, error) {
	matches, err := s.matchRepo.GetByLeagueAndWeek(leagueID, week)
	if err != nil {
		return nil, err
	}

	// Check if already played
	for _, m := range matches {
		if m.Played {
			return nil, fmt.Errorf("%d. hafta zaten oynanmış", week)
		}
	}

	for i, m := range matches {
		homeTeam, err := s.teamRepo.GetByID(m.HomeTeamID)
		if err != nil {
			return nil, err
		}
		awayTeam, err := s.teamRepo.GetByID(m.AwayTeamID)
		if err != nil {
			return nil, err
		}

		// Simulate the match
		hg, ag := SimulateMatch(*homeTeam, *awayTeam)

		// Update the score
		if err := s.matchRepo.UpdateScore(m.ID, hg, ag); err != nil {
			return nil, err
		}

		// Mark as played (triggers standings update)
		if err := s.matchRepo.MarkPlayed(m.ID); err != nil {
			return nil, err
		}

		// Fetch players
		homePlayers, _ := s.playerRepo.GetByTeamID(m.HomeTeamID)
		awayPlayers, _ := s.playerRepo.GetByTeamID(m.AwayTeamID)

		// Generate events
		events := GenerateMatchEvents(m.ID, *homeTeam, *awayTeam, homePlayers, awayPlayers, hg, ag)
		if len(events) > 0 {
			if err := s.eventRepo.CreateBatch(events); err != nil {
				return nil, err
			}
		}

		matches[i].HomeGoals = hg
		matches[i].AwayGoals = ag
		matches[i].Played = true
		matches[i].Events = events
	}

	// Advance league's current week
	s.leagueRepo.UpdateCurrentWeek(leagueID, week)

	return matches, nil
}

func (s *matchService) PlayAll(leagueID int) error {
	weeks, err := s.matchRepo.GetUnplayedWeeks(leagueID)
	if err != nil {
		return err
	}
	if len(weeks) == 0 {
		return fmt.Errorf("tüm maçlar zaten oynanmış")
	}

	for _, w := range weeks {
		if _, err := s.PlayWeek(leagueID, w); err != nil {
			return fmt.Errorf("hafta %d oynanırken hata: %w", w, err)
		}
	}

	// Mark league as finished
	return s.leagueRepo.UpdateStatus(leagueID, "finished")
}

func (s *matchService) UpdateMatchScore(id int, req model.UpdateMatchRequest) (*model.Match, error) {
	match, err := s.matchRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if !match.Played {
		return nil, fmt.Errorf("maç henüz oynanmamış")
	}

	// Update score (trigger updates standings automatically)
	if err := s.matchRepo.UpdateScore(id, req.HomeGoals, req.AwayGoals); err != nil {
		return nil, err
	}

	// Delete old events and regenerate
	if err := s.eventRepo.DeleteByMatchID(id); err != nil {
		return nil, err
	}

	homeTeam, _ := s.teamRepo.GetByID(match.HomeTeamID)
	awayTeam, _ := s.teamRepo.GetByID(match.AwayTeamID)
	homePlayers, _ := s.playerRepo.GetByTeamID(match.HomeTeamID)
	awayPlayers, _ := s.playerRepo.GetByTeamID(match.AwayTeamID)

	events := GenerateMatchEvents(id, *homeTeam, *awayTeam, homePlayers, awayPlayers, req.HomeGoals, req.AwayGoals)
	if len(events) > 0 {
		s.eventRepo.CreateBatch(events)
	}

	match.HomeGoals = req.HomeGoals
	match.AwayGoals = req.AwayGoals
	match.Events = events
	return match, nil
}

func (s *matchService) GetMatchEvents(matchID int) ([]model.MatchEvent, error) {
	return s.eventRepo.GetByMatchID(matchID)
}