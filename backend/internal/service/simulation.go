package service

import (
	"football-sim/internal/model"
	"math"
	"math/rand"
	"sort"
)

// Goal model calibrated against ESPN Süper Lig 2025-26 full season (297 matches):
// avg 2.69 total, home 1.46 / away 1.23, draw 28%, 5+ goals 12%, 4-3 ~1%.
const (
	goalBaseLambda   = 1.28
	goalLambdaExp    = 0.55
	homeAdvantage    = 1.12
	awayLambdaFactor = 0.94
)

// SimulatedScore holds the final score and how it was built.
type SimulatedScore struct {
	HomeGoals    int
	AwayGoals    int
	HomeRegular  int
	AwayRegular  int
	HomeOwnGoals int // conceded by home → counts for away
	AwayOwnGoals int // conceded by away → counts for home
}

// SimulateMatch returns the final score for a match.
func SimulateMatch(home, away model.Team) (homeGoals, awayGoals int) {
	s := SimulateMatchDetailed(home, away)
	return s.HomeGoals, s.AwayGoals
}

// SimulateMatchDetailed runs the full simulation including own goals.
func SimulateMatchDetailed(home, away model.Team) SimulatedScore {
	homeLambda := expectedGoals(home.Attack, away.Defense) * homeAdvantage
	awayLambda := expectedGoals(away.Attack, home.Defense) * awayLambdaFactor

	upset := applyUpsetFactor(home, away, &homeLambda, &awayLambda)

	// Normal scores — mostly 0–3 per team (~2–4 total)
	homeRegular := poissonRandom(homeLambda)
	awayRegular := poissonRandom(awayLambda)

	// Rare blowout: one team hits 5–6, the other stays low (skipped if upset)
	if !upset {
		if rout := maybeRout(home, away); rout != nil {
			homeRegular = rout.home
			awayRegular = rout.away
		}
	}

	var homeOG, awayOG int
	// ~5% of matches have an own goal
	if rand.Float64() < 0.05 {
		if rand.Float64() < 0.5 {
			homeOG = 1
		} else {
			awayOG = 1
		}
	}

	return SimulatedScore{
		HomeGoals:    homeRegular + awayOG,
		AwayGoals:    awayRegular + homeOG,
		HomeRegular:  homeRegular,
		AwayRegular:  awayRegular,
		HomeOwnGoals: homeOG,
		AwayOwnGoals: awayOG,
	}
}

func applyUpsetFactor(home, away model.Team, homeLambda, awayLambda *float64) bool {
	// ~9% chance of a rare upset — weaker side gets a boost
	if rand.Float64() >= 0.09 {
		return false
	}
	homeStr := home.Attack + home.Defense
	awayStr := away.Attack + away.Defense
	diff := math.Abs(float64(homeStr - awayStr))
	if diff < 8 {
		return false // too evenly matched, no upset
	}
	if homeStr < awayStr {
		*homeLambda *= 1.45
		*awayLambda *= 0.78
	} else {
		*awayLambda *= 1.45
		*homeLambda *= 0.78
	}
	return true
}

type routScore struct {
	home, away int
}

// maybeRout — rarely one team scores 5–6 in a mismatch (e.g. 5–0, 6–1).
func maybeRout(home, away model.Team) *routScore {
	homeEdge := float64(home.Attack) / float64(away.Defense) * homeAdvantage
	awayEdge := float64(away.Attack) / float64(home.Defense)

	const minEdge = 0.28 // clear favourite required (~84 atk vs ~66 def)
	favHome := homeEdge > awayEdge+minEdge
	favAway := awayEdge > homeEdge+minEdge
	if !favHome && !favAway {
		return nil
	}

	var favEdge float64
	if favHome {
		favEdge = homeEdge - awayEdge
	} else {
		favEdge = awayEdge - homeEdge
	}

	// ~4–8% depending on gap — stays rare
	pRout := 0.04 + math.Min(0.04, favEdge*0.12)
	if rand.Float64() >= pRout {
		return nil
	}

	favGoals := routGoalCount()
	// Opponent barely scores in a rout
	under := poissonRandom(0.45)
	if under > 1 {
		under = 1
	}

	if favHome {
		return &routScore{home: favGoals, away: under}
	}
	return &routScore{home: under, away: favGoals}
}

func routGoalCount() int {
	r := rand.Float64()
	switch {
	case r < 0.55:
		return 5
	case r < 0.88:
		return 6
	default:
		return 4 // occasional 4–0 style
	}
}

func expectedGoals(attack, defense int) float64 {
	ratio := float64(attack) / float64(defense)
	lambda := goalBaseLambda * math.Pow(ratio, goalLambdaExp)
	return math.Max(0.35, math.Min(2.4, lambda))
}

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

// GenerateMatchEvents builds timeline events from a simulated score.
func GenerateMatchEvents(
	matchID int,
	homeTeam, awayTeam model.Team,
	homePlayers, awayPlayers []model.Player,
	score SimulatedScore,
) []model.MatchEvent {
	var events []model.MatchEvent
	usedMinutes := map[int]bool{}

	for i := 0; i < score.HomeRegular; i++ {
		events = append(events, buildGoalEvent(matchID, homeTeam, awayTeam, homeTeam, homePlayers, usedMinutes, "goal"))
	}
	for i := 0; i < score.AwayRegular; i++ {
		events = append(events, buildGoalEvent(matchID, homeTeam, awayTeam, awayTeam, awayPlayers, usedMinutes, "goal"))
	}
	for i := 0; i < score.HomeOwnGoals; i++ {
		events = append(events, buildGoalEvent(matchID, homeTeam, awayTeam, homeTeam, homePlayers, usedMinutes, "own_goal"))
	}
	for i := 0; i < score.AwayOwnGoals; i++ {
		events = append(events, buildGoalEvent(matchID, homeTeam, awayTeam, awayTeam, awayPlayers, usedMinutes, "own_goal"))
	}

	events = append(events, generateCards(matchID, homeTeam, homePlayers, usedMinutes)...)
	events = append(events, generateCards(matchID, awayTeam, awayPlayers, usedMinutes)...)

	events = append(events, generateSummaryEvents(matchID, homeTeam, homePlayers)...)
	events = append(events, generateSummaryEvents(matchID, awayTeam, awayPlayers)...)
	events = append(events, generateVARCancelledGoal(matchID, homeTeam, awayTeam, homePlayers, awayPlayers)...)

	sort.Slice(events, func(i, j int) bool {
		if events[i].Minute == events[j].Minute {
			return eventOrder(events[i].Type) < eventOrder(events[j].Type)
		}
		return events[i].Minute < events[j].Minute
	})
	return events
}

func eventOrder(t string) int {
	switch t {
	case "goal":
		return 0
	case "var_cancelled_goal":
		return 1
	case "own_goal":
		return 2
	case "yellow_card":
		return 3
	case "red_card":
		return 4
	case "substitution":
		return 5
	case "offside":
		return 6
	case "injury":
		return 7
	default:
		return 8
	}
}

func buildGoalEvent(
	matchID int,
	homeTeam, awayTeam model.Team,
	team model.Team,
	players []model.Player,
	usedMinutes map[int]bool,
	eventType string,
) model.MatchEvent {
	minute := randomMinute(usedMinutes)
	scorer := randomScorer(players)

	e := model.MatchEvent{
		MatchID:  matchID,
		TeamID:   team.ID,
		TeamName: team.Name,
		Type:     eventType,
		Minute:   minute,
	}
	if scorer != nil {
		e.PlayerID = &scorer.ID
		e.PlayerName = scorer.Name
	}

	method := "own_goal"
	if eventType == "goal" {
		rng := rand.New(rand.NewSource(replaySeed(minute, e.PlayerID, team.ID)))
		method = PickGoalMethod(rng, eventType, "")
		if GoalMethodUsesAssist(method) {
			if assister := randomAssister(players, scorer); assister != nil {
				e.AssistPlayerID = &assister.ID
				e.AssistPlayerName = assister.Name
			}
		}
	}

	if eventType == "goal" || eventType == "own_goal" {
		e.GoalReplay = GenerateGoalReplay(
			eventType, e.Minute, e.PlayerID, e.PlayerName, e.AssistPlayerName,
			e.TeamID, homeTeam.ID, awayTeam.ID, method,
		)
	}
	return e
}

func generateCards(
	matchID int,
	team model.Team,
	players []model.Player,
	usedMinutes map[int]bool,
) []model.MatchEvent {
	var events []model.MatchEvent
	if len(players) == 0 {
		return events
	}

	playerYellows := map[int]int{}
	sentOff := map[int]bool{}

	// ~0.9 yellows per team per match (typical PL avg ~2 total)
	yellowCount := poissonRandom(0.9)
	if yellowCount > 2 {
		yellowCount = 2
	}

	for i := 0; i < yellowCount; i++ {
		player := pickCardedPlayer(players, playerYellows, sentOff)
		if player == nil {
			break
		}
		minute := randomMinute(usedMinutes)

		if playerYellows[player.ID] == 1 {
			// Second yellow → red (same minute)
			events = append(events, model.MatchEvent{
				MatchID:    matchID,
				TeamID:     team.ID,
				TeamName:   team.Name,
				PlayerID:   &player.ID,
				PlayerName: player.Name,
				Type:       "red_card",
				Minute:     minute,
			})
			sentOff[player.ID] = true
			continue
		}

		playerYellows[player.ID]++
		events = append(events, model.MatchEvent{
			MatchID:    matchID,
			TeamID:     team.ID,
			TeamName:   team.Name,
			PlayerID:   &player.ID,
			PlayerName: player.Name,
			Type:       "yellow_card",
			Minute:     minute,
		})
	}

	// Direct red ~6% per team
	if rand.Float64() < 0.06 {
		player := pickCardedPlayer(players, playerYellows, sentOff)
		if player != nil {
			minute := randomMinute(usedMinutes)
			events = append(events, model.MatchEvent{
				MatchID:    matchID,
				TeamID:     team.ID,
				TeamName:   team.Name,
				PlayerID:   &player.ID,
				PlayerName: player.Name,
				Type:       "red_card",
				Minute:     minute,
			})
		}
	}

	return events
}

func pickCardedPlayer(players []model.Player, yellows map[int]int, sentOff map[int]bool) *model.Player {
	// 35% chance to give a second yellow to someone already booked
	var candidates []model.Player
	for _, p := range players {
		if sentOff[p.ID] {
			continue
		}
		if yellows[p.ID] == 1 && rand.Float64() < 0.35 {
			cp := p
			return &cp
		}
		candidates = append(candidates, p)
	}
	if len(candidates) == 0 {
		return nil
	}
	p := candidates[rand.Intn(len(candidates))]
	return &p
}

func randomScorer(players []model.Player) *model.Player {
	return randomWeighted(players, map[string]float64{
		"FWD": 0.50, "MID": 0.30, "DEF": 0.15, "GK": 0.05,
	})
}

func randomAssister(players []model.Player, scorer *model.Player) *model.Player {
	var pool []model.Player
	scorerID := 0
	if scorer != nil {
		scorerID = scorer.ID
	}
	for _, p := range players {
		if p.ID != scorerID && (p.Position == "MID" || p.Position == "FWD" || p.Position == "DEF") {
			pool = append(pool, p)
		}
	}
	if len(pool) == 0 {
		return nil
	}
	return randomWeighted(pool, map[string]float64{
		"FWD": 0.35, "MID": 0.55, "DEF": 0.10,
	})
}

func randomWeighted(players []model.Player, weights map[string]float64) *model.Player {
	if len(players) == 0 {
		return nil
	}
	total := 0.0
	for _, p := range players {
		w := weights[p.Position]
		if w == 0 {
			w = 0.1
		}
		total += w
	}
	r := rand.Float64() * total
	for _, p := range players {
		w := weights[p.Position]
		if w == 0 {
			w = 0.1
		}
		r -= w
		if r <= 0 {
			cp := p
			return &cp
		}
	}
	cp := players[len(players)-1]
	return &cp
}

func randomMinute(used map[int]bool) int {
	for attempts := 0; attempts < 200; attempts++ {
		m := rand.Intn(90) + 1
		if !used[m] {
			used[m] = true
			return m
		}
	}
	// fallback if many events share minutes
	for m := 1; m <= 90; m++ {
		if !used[m] {
			used[m] = true
			return m
		}
	}
	return 90
}

func generateSummaryEvents(matchID int, team model.Team, players []model.Player) []model.MatchEvent {
	var events []model.MatchEvent
	events = append(events, generateOffsides(matchID, team, players)...)
	events = append(events, generateSubstitutions(matchID, team, players)...)
	events = append(events, generateInjuries(matchID, team, players)...)
	return events
}

func generateOffsides(matchID int, team model.Team, players []model.Player) []model.MatchEvent {
	if len(players) == 0 {
		return nil
	}
	count := poissonRandom(1.1)
	if count > 3 {
		count = 3
	}
	var events []model.MatchEvent
	for i := 0; i < count; i++ {
		player := players[rand.Intn(len(players))]
		events = append(events, model.MatchEvent{
			MatchID:    matchID,
			TeamID:     team.ID,
			TeamName:   team.Name,
			PlayerID:   &player.ID,
			PlayerName: player.Name,
			Type:       "offside",
			Minute:     randomLooseMinute(1, 90),
		})
	}
	return events
}

func generateSubstitutions(matchID int, team model.Team, players []model.Player) []model.MatchEvent {
	if len(players) < 2 {
		return nil
	}
	slots := []int{46, 58, 71, 82}
	subCount := 3
	if len(players) < 5 {
		subCount = 2
	}
	var events []model.MatchEvent
	usedOut := map[int]bool{}
	usedIn := map[int]bool{}
	for i := 0; i < subCount && i < len(slots); i++ {
		out, in := pickSubstitutionPair(players, usedOut, usedIn)
		if out == nil || in == nil {
			break
		}
		usedOut[out.ID] = true
		usedIn[in.ID] = true
		minute := slots[i] + rand.Intn(5)
		events = append(events, model.MatchEvent{
			MatchID:          matchID,
			TeamID:           team.ID,
			TeamName:         team.Name,
			PlayerID:         &out.ID,
			PlayerName:       out.Name,
			AssistPlayerID:   &in.ID,
			AssistPlayerName: in.Name,
			Type:             "substitution",
			Minute:           minute,
		})
	}
	return events
}

func pickSubstitutionPair(players []model.Player, usedOut, usedIn map[int]bool) (*model.Player, *model.Player) {
	var outs, ins []model.Player
	for _, p := range players {
		if !usedOut[p.ID] {
			outs = append(outs, p)
		}
		if !usedIn[p.ID] {
			ins = append(ins, p)
		}
	}
	if len(outs) == 0 || len(ins) == 0 {
		return nil, nil
	}
	out := outs[rand.Intn(len(outs))]
	for attempts := 0; attempts < 20; attempts++ {
		in := ins[rand.Intn(len(ins))]
		if in.ID != out.ID {
			cp := in
			return &out, &cp
		}
	}
	return nil, nil
}

func generateInjuries(matchID int, team model.Team, players []model.Player) []model.MatchEvent {
	if len(players) == 0 || rand.Float64() > 0.18 {
		return nil
	}
	player := players[rand.Intn(len(players))]
	return []model.MatchEvent{{
		MatchID:    matchID,
		TeamID:     team.ID,
		TeamName:   team.Name,
		PlayerID:   &player.ID,
		PlayerName: player.Name,
		Type:       "injury",
		Minute:     randomLooseMinute(10, 85),
	}}
}

func generateVARCancelledGoal(
	matchID int,
	homeTeam, awayTeam model.Team,
	homePlayers, awayPlayers []model.Player,
) []model.MatchEvent {
	if rand.Float64() > 0.10 {
		return nil
	}
	var team model.Team
	var players []model.Player
	if rand.Intn(2) == 0 {
		team, players = homeTeam, homePlayers
	} else {
		team, players = awayTeam, awayPlayers
	}
	if len(players) == 0 {
		return nil
	}
	scorer := randomScorer(players)
	if scorer == nil {
		return nil
	}
	return []model.MatchEvent{{
		MatchID:    matchID,
		TeamID:     team.ID,
		TeamName:   team.Name,
		PlayerID:   &scorer.ID,
		PlayerName: scorer.Name,
		Type:       "var_cancelled_goal",
		Minute:     randomLooseMinute(15, 88),
	}}
}

func randomLooseMinute(min, max int) int {
	if max <= min {
		return min
	}
	return rand.Intn(max-min+1) + min
}
