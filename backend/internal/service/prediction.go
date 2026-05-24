package service

import (
	"football-sim/internal/model"
	"math"
	"math/rand"
	"sort"
)

const simulationCount = 1000

// Predict — Monte Carlo championship prediction
// Simulates remaining matches 1000 times and counts how many times each team wins
func Predict(
	standings []model.Standing,
	remainingMatches []model.Match,
	teams []model.Team,
) []model.Prediction {

	// Team map — fast lookup by ID
	teamMap := map[int]model.Team{}
	for _, t := range teams {
		teamMap[t.ID] = t
	}

	// Championship counter
	championships := map[int]int{}
	for _, s := range standings {
		championships[s.TeamID] = 0
	}

	// 1000 simulations
	for i := 0; i < simulationCount; i++ {
		// Copy current standings
		simStandings := map[int]model.Standing{}
		for _, s := range standings {
			simStandings[s.TeamID] = s
		}

		// Simulate remaining matches
		for _, m := range remainingMatches {
			home := teamMap[m.HomeTeamID]
			away := teamMap[m.AwayTeamID]
			hg, ag := SimulateMatch(home, away)

			// Update standings
			simStandings = updateSimStandings(simStandings, m.HomeTeamID, m.AwayTeamID, hg, ag)
		}

		// Determine champion
		champion := findChampion(simStandings)
		championships[champion]++
	}

	// Calculate percentages
	var predictions []model.Prediction
	for _, s := range standings {
		t := teamMap[s.TeamID]
		pct := float64(championships[s.TeamID]) / float64(simulationCount) * 100
		predictions = append(predictions, model.Prediction{
			TeamID:     s.TeamID,
			TeamName:   s.TeamName,
			CrestURL:   t.CrestURL,
			Percentage: math.Round(pct*10) / 10, // 1 decimal place
		})
	}

	// Sort by percentage
	sort.Slice(predictions, func(i, j int) bool {
		return predictions[i].Percentage > predictions[j].Percentage
	})

	return predictions
}

func updateSimStandings(
	standings map[int]model.Standing,
	homeID, awayID, hg, ag int,
) map[int]model.Standing {
	home := standings[homeID]
	away := standings[awayID]

	home.Played++
	away.Played++
	home.GoalsFor += hg
	home.GoalsAgainst += ag
	away.GoalsFor += ag
	away.GoalsAgainst += hg

	if hg > ag {
		home.Won++
		away.Lost++
	} else if hg < ag {
		away.Won++
		home.Lost++
	} else {
		home.Drawn++
		away.Drawn++
	}

	home.Points = home.Won*3 + home.Drawn
	away.Points = away.Won*3 + away.Drawn
	home.GoalDiff = home.GoalsFor - home.GoalsAgainst
	away.GoalDiff = away.GoalsFor - away.GoalsAgainst

	standings[homeID] = home
	standings[awayID] = away
	return standings
}

func findChampion(standings map[int]model.Standing) int {
	var best model.Standing
	first := true
	for _, s := range standings {
		if first {
			best = s
			first = false
			continue
		}
		if s.Points > best.Points ||
			(s.Points == best.Points && s.GoalDiff > best.GoalDiff) ||
			(s.Points == best.Points && s.GoalDiff == best.GoalDiff && s.GoalsFor > best.GoalsFor) {
			best = s
		}
	}

	// Break ties randomly
	var tied []model.Standing
	for _, s := range standings {
		if s.Points == best.Points && s.GoalDiff == best.GoalDiff {
			tied = append(tied, s)
		}
	}
	if len(tied) > 1 {
		return tied[rand.Intn(len(tied))].TeamID
	}

	return best.TeamID
}