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
			return nil, fmt.Errorf("week %d has already been played", week)
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
		score := SimulateMatchDetailed(*homeTeam, *awayTeam)
		MaybeApplyExtraTime(&score)

		// Update the score
		if err := s.matchRepo.UpdateScore(m.ID, score.HomeGoals, score.AwayGoals); err != nil {
			return nil, err
		}

		// Mark as played (triggers standings update)
		if err := s.matchRepo.MarkPlayed(m.ID); err != nil {
			return nil, err
		}

		// Ensure squads exist so goals, assists and cards get player names
		homePlayers, err := s.squadForTeam(m.HomeTeamID)
		if err != nil {
			return nil, err
		}
		awayPlayers, err := s.squadForTeam(m.AwayTeamID)
		if err != nil {
			return nil, err
		}

		// Generate events
		events := GenerateMatchEvents(m.ID, *homeTeam, *awayTeam, homePlayers, awayPlayers, score)
		if len(events) > 0 {
			if err := s.eventRepo.CreateBatch(events); err != nil {
				return nil, err
			}
			saved, err := s.eventRepo.GetByMatchID(m.ID)
			if err != nil {
				return nil, err
			}
			matches[i].Events = saved
		}

		matches[i].HomeGoals = score.HomeGoals
		matches[i].AwayGoals = score.AwayGoals
		matches[i].Played = true
		if len(events) == 0 {
			matches[i].Events = events
		}
	}

	// Advance league's current week
	s.leagueRepo.UpdateCurrentWeek(leagueID, week)

	return matches, nil
}

func (s *matchService) PlayAll(leagueID int) ([]model.WeekResult, error) {
	weeks, err := s.matchRepo.GetUnplayedWeeks(leagueID)
	if err != nil {
		return nil, err
	}
	if len(weeks) == 0 {
		return nil, s.leagueRepo.UpdateStatus(leagueID, "finished")
	}

	results := make([]model.WeekResult, 0, len(weeks))
	for _, w := range weeks {
		matches, err := s.PlayWeek(leagueID, w)
		if err != nil {
			return nil, fmt.Errorf("error playing week %d: %w", w, err)
		}
		results = append(results, model.WeekResult{Week: w, Matches: matches})
	}

	if err := s.leagueRepo.UpdateStatus(leagueID, "finished"); err != nil {
		return nil, err
	}
	return results, nil
}

func (s *matchService) UpdateMatchScore(id int, req model.UpdateMatchRequest) (*model.Match, error) {
	match, err := s.matchRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if !match.Played {
		return nil, fmt.Errorf("match has not been played yet")
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
	homePlayers, _ := s.squadForTeam(match.HomeTeamID)
	awayPlayers, _ := s.squadForTeam(match.AwayTeamID)

	events := GenerateMatchEvents(id, *homeTeam, *awayTeam, homePlayers, awayPlayers, SimulatedScore{
		HomeGoals:   req.HomeGoals,
		AwayGoals:   req.AwayGoals,
		HomeRegular: req.HomeGoals,
		AwayRegular: req.AwayGoals,
	})
	if len(events) > 0 {
		s.eventRepo.CreateBatch(events)
	}

	match.HomeGoals = req.HomeGoals
	match.AwayGoals = req.AwayGoals
	match.Events = events
	return match, nil
}

func (s *matchService) squadForTeam(teamID int) ([]model.Player, error) {
	players, err := s.playerRepo.GetByTeamID(teamID)
	if err != nil {
		return nil, err
	}
	if len(players) > 0 {
		return matchdaySquad(filterRealSquad(players)), nil
	}

	defaultSquad := []struct {
		Name     string
		Position string
	}{
		{"Goalkeeper", "GK"},
		{"Defender 1", "DEF"}, {"Defender 2", "DEF"}, {"Defender 3", "DEF"}, {"Defender 4", "DEF"},
		{"Midfielder 1", "MID"}, {"Midfielder 2", "MID"}, {"Midfielder 3", "MID"},
		{"Forward 1", "FWD"}, {"Forward 2", "FWD"}, {"Forward 3", "FWD"},
	}

	for _, slot := range defaultSquad {
		p := model.Player{TeamID: teamID, Name: slot.Name, Position: slot.Position}
		if err := s.playerRepo.Create(&p); err != nil {
			return nil, err
		}
		players = append(players, p)
	}
	return players, nil
}

func (s *matchService) GetMatchEvents(matchID int) ([]model.MatchEvent, error) {
	return s.eventRepo.GetByMatchID(matchID)
}

func (s *matchService) DeleteMatchEvent(matchID, eventID int) error {
	match, err := s.matchRepo.GetByID(matchID)
	if err != nil {
		return err
	}
	if !match.Played {
		return fmt.Errorf("match has not been played yet")
	}
	return s.eventRepo.DeleteByID(matchID, eventID)
}

func (s *matchService) GetTopScorers(leagueID int) ([]model.TopScorer, error) {
	return s.eventRepo.GetTopScorers(leagueID, 10)
}

func (s *matchService) RegenerateLeagueEvents(leagueID int) error {
	matches, err := s.matchRepo.GetByLeagueID(leagueID)
	if err != nil {
		return err
	}

	for _, m := range matches {
		if !m.Played {
			continue
		}

		if err := s.eventRepo.DeleteByMatchID(m.ID); err != nil {
			return err
		}

		homeTeam, err := s.teamRepo.GetByID(m.HomeTeamID)
		if err != nil {
			return err
		}
		awayTeam, err := s.teamRepo.GetByID(m.AwayTeamID)
		if err != nil {
			return err
		}
		homePlayers, err := s.squadForTeam(m.HomeTeamID)
		if err != nil {
			return err
		}
		awayPlayers, err := s.squadForTeam(m.AwayTeamID)
		if err != nil {
			return err
		}

		score := ScoreFromTotals(m.HomeGoals, m.AwayGoals)
		events := GenerateMatchEvents(m.ID, *homeTeam, *awayTeam, homePlayers, awayPlayers, score)
		if len(events) == 0 {
			continue
		}
		if err := s.eventRepo.CreateBatch(events); err != nil {
			return fmt.Errorf("match %d: %w", m.ID, err)
		}
	}
	return nil
}

func (s *matchService) GetTopAssists(leagueID int) ([]model.TopAssist, error) {
	return s.eventRepo.GetTopAssists(leagueID, 10)
}

func (s *matchService) GetMostCards(leagueID int) ([]model.MostCards, error) {
	return s.eventRepo.GetMostCards(leagueID, 50)
}