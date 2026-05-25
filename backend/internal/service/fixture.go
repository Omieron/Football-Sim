package service

import "football-sim/internal/model"

// GenerateFixtures — Round Robin algorithm
// Each team plays against every other team twice (home/away)
func GenerateFixtures(leagueID int, teams []model.Team) []model.Match {
	n := len(teams)
	var matches []model.Match
	week := 1

	// First round (home/away)
	for round := 0; round < n-1; round++ {
		for i := 0; i < n/2; i++ {
			home := teams[i]
			away := teams[n-1-i]
			matches = append(matches, model.Match{
				LeagueID:   leagueID,
				Week:       week,
				HomeTeamID: home.ID,
				AwayTeamID: away.ID,
			})
		}
		week++
		// Rotate teams (first team stays fixed)
		teams = rotateTeams(teams)
	}

	// Second round — same week structure, home/away swapped
	firstRoundMatches := matches
	matchesPerWeek := n / 2
	weekCount := 0
	for _, m := range firstRoundMatches {
		matches = append(matches, model.Match{
			LeagueID:   leagueID,
			Week:       week,
			HomeTeamID: m.AwayTeamID,
			AwayTeamID: m.HomeTeamID,
		})
		weekCount++
		if weekCount >= matchesPerWeek {
			week++
			weekCount = 0
		}
	}

	return matches
}

func rotateTeams(teams []model.Team) []model.Team {
	n := len(teams)
	rotated := make([]model.Team, n)
	rotated[0] = teams[0]           // first team stays fixed
	rotated[1] = teams[n-1]         // last team moves to position 1
	for i := 2; i < n; i++ {
		rotated[i] = teams[i-1]
	}
	return rotated
}