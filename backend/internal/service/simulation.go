package service

import (
	"football-sim/internal/model"
	"math"
	"math/rand"
	"sort"
)

// SimulateMatch — simulates a match based on team strengths
// Uses Poisson distribution for realistic score distribution
func SimulateMatch(home, away model.Team) (homeGoals, awayGoals int) {
	// Home advantage factor of 10%
	homeLambda := expectedGoals(home.Attack, away.Defense) * 1.10
	awayLambda := expectedGoals(away.Attack, home.Defense)

	homeGoals = poissonRandom(homeLambda)
	awayGoals = poissonRandom(awayLambda)
	return
}

// expectedGoals — expected number of goals
// high attack vs low opponent defense yields more goals
func expectedGoals(attack, defense int) float64 {
	base := float64(attack) / float64(defense)
	return math.Max(0.3, base*1.2)
}

// poissonRandom — generate a random number from a Poisson distribution
// Goal distribution in real football follows a Poisson distribution
func poissonRandom(lambda float64) int {
	L := math.Exp(-lambda)
	k := 0
	p := 1.0
	for p > L {
		k++
		p *= rand.Float64()
	}
	return k - 1
}

// GenerateMatchEvents — generate match events (goals, cards)
func GenerateMatchEvents(
	matchID int,
	homeTeam, awayTeam model.Team,
	homePlayers, awayPlayers []model.Player,
	homeGoals, awayGoals int,
) []model.MatchEvent {

	var events []model.MatchEvent
	usedMinutes := map[int]bool{}

	// Goal events — home team
	for i := 0; i < homeGoals; i++ {
		minute := randomMinute(usedMinutes)
		player := randomPlayer(homePlayers)
		e := model.MatchEvent{
			MatchID:  matchID,
			TeamID:   homeTeam.ID,
			TeamName: homeTeam.Name,
			Type:     "goal",
			Minute:   minute,
		}
		if player != nil {
			e.PlayerID   = &player.ID
			e.PlayerName = player.Name
		}
		events = append(events, e)
	}

	// Goal events — away team
	for i := 0; i < awayGoals; i++ {
		minute := randomMinute(usedMinutes)
		player := randomPlayer(awayPlayers)
		e := model.MatchEvent{
			MatchID:  matchID,
			TeamID:   awayTeam.ID,
			TeamName: awayTeam.Name,
			Type:     "goal",
			Minute:   minute,
		}
		if player != nil {
			e.PlayerID   = &player.ID
			e.PlayerName = player.Name
		}
		events = append(events, e)
	}

	// Cards — 0 to 3 per team
	events = append(events, generateCards(matchID, homeTeam, homePlayers, usedMinutes)...)
	events = append(events, generateCards(matchID, awayTeam, awayPlayers, usedMinutes)...)

	// Sort by minute
	sort.Slice(events, func(i, j int) bool {
		return events[i].Minute < events[j].Minute
	})

	return events
}

func generateCards(
	matchID int,
	team model.Team,
	players []model.Player,
	usedMinutes map[int]bool,
) []model.MatchEvent {
	var events []model.MatchEvent

	yellowCount := rand.Intn(4) // 0-3 yellow cards
	playerYellows := map[int]int{}

	for i := 0; i < yellowCount; i++ {
		player := randomPlayer(players)
		minute := randomMinute(usedMinutes)

		e := model.MatchEvent{
			MatchID:  matchID,
			TeamID:   team.ID,
			TeamName: team.Name,
			Type:     "yellow_card",
			Minute:   minute,
		}

		if player != nil {
			e.PlayerID   = &player.ID
			e.PlayerName = player.Name
			playerYellows[player.ID]++

			// 2 yellows = red card
			if playerYellows[player.ID] == 2 {
				redMinute := randomMinute(usedMinutes)
				red := model.MatchEvent{
					MatchID:    matchID,
					TeamID:     team.ID,
					TeamName:   team.Name,
					PlayerID:   &player.ID,
					PlayerName: player.Name,
					Type:       "red_card",
					Minute:     redMinute,
				}
				events = append(events, red)
			}
		}
		events = append(events, e)
	}

	// 8% chance of a straight red card
	if rand.Float64() < 0.08 {
		player := randomPlayer(players)
		minute := randomMinute(usedMinutes)
		e := model.MatchEvent{
			MatchID:  matchID,
			TeamID:   team.ID,
			TeamName: team.Name,
			Type:     "red_card",
			Minute:   minute,
		}
		if player != nil {
			e.PlayerID   = &player.ID
			e.PlayerName = player.Name
		}
		events = append(events, e)
	}

	return events
}

func randomMinute(used map[int]bool) int {
	for {
		m := rand.Intn(90) + 1
		if !used[m] {
			used[m] = true
			return m
		}
	}
}

func randomPlayer(players []model.Player) *model.Player {
	if len(players) == 0 {
		return nil
	}
	p := players[rand.Intn(len(players))]
	return &p
}