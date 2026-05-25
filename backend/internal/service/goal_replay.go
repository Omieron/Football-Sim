package service

import (
	"football-sim/internal/model"
	"math/rand"
	"strings"
)

type replayTemplate struct {
	id       string
	label    string
	duration int
	frames   []rawKeyframe
}

type rawKeyframe struct {
	t         float64
	ball      [2]float64
	positions map[string][2]float64
}

func replaySeed(minute int, playerID *int, teamID int) int64 {
	pid := 0
	if playerID != nil {
		pid = *playerID
	}
	return int64(minute*7919 + pid*17 + teamID)
}

func shortName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "?"
	}
	parts := strings.Fields(name)
	if len(parts) > 1 {
		s := parts[len(parts)-1]
		if len(s) > 8 {
			return s[:8]
		}
		return s
	}
	if len(name) > 8 {
		return name[:8]
	}
	return name
}

func mirrorX(x float64, attackRight bool) float64 {
	if attackRight {
		return x
	}
	return 100 - x
}

func pt(x, y float64, attackRight bool) model.GoalReplayPoint {
	return model.GoalReplayPoint{X: mirrorX(x, attackRight), Y: y}
}

func templateCounter(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "counter", label: "Kontra atak", duration: 3200,
		frames: []rawKeyframe{
			{0, [2]float64{38, 52}, map[string][2]float64{
				"assister": {36, 52}, "scorer": {58, 44}, "def1": {48, 58}, "def2": {52, 38}, "gk": {94, 50},
			}},
			{0.38, [2]float64{58, 46}, map[string][2]float64{
				"assister": {40, 54}, "scorer": {60, 46}, "def1": {50, 56}, "def2": {54, 42}, "gk": {93, 48},
			}},
			{0.72, [2]float64{78, 48}, map[string][2]float64{
				"assister": {42, 55}, "scorer": {76, 48}, "def1": {62, 52}, "def2": {68, 44}, "gk": {92, 50},
			}},
			{1, [2]float64{91, 49}, map[string][2]float64{
				"assister": {44, 56}, "scorer": {84, 49}, "def1": {72, 50}, "def2": {76, 46}, "gk": {90, 51},
			}},
		},
	}
}

func templateWideCross(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "wide_cross", label: "Orta & bitiriş", duration: 3600,
		frames: []rawKeyframe{
			{0, [2]float64{72, 18}, map[string][2]float64{
				"assister": {70, 16}, "scorer": {78, 52}, "def1": {74, 28}, "def2": {80, 48}, "gk": {94, 50},
			}},
			{0.45, [2]float64{80, 42}, map[string][2]float64{
				"assister": {72, 18}, "scorer": {79, 50}, "def1": {76, 32}, "def2": {81, 46}, "gk": {93, 49},
			}},
			{0.78, [2]float64{86, 50}, map[string][2]float64{
				"assister": {73, 20}, "scorer": {85, 50}, "def1": {78, 38}, "def2": {82, 48}, "gk": {91, 51},
			}},
			{1, [2]float64{91, 50}, map[string][2]float64{
				"assister": {74, 22}, "scorer": {87, 50}, "def1": {80, 42}, "def2": {84, 49}, "gk": {89, 50},
			}},
		},
	}
}

func templateSolo(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "solo", label: "Solo dripling", duration: 3000,
		frames: []rawKeyframe{
			{0, [2]float64{55, 50}, map[string][2]float64{
				"scorer": {55, 50}, "def1": {62, 44}, "def2": {64, 56}, "gk": {94, 50},
			}},
			{0.4, [2]float64{68, 46}, map[string][2]float64{
				"scorer": {68, 46}, "def1": {66, 44}, "def2": {70, 52}, "gk": {93, 49},
			}},
			{0.75, [2]float64{82, 48}, map[string][2]float64{
				"scorer": {82, 48}, "def1": {74, 46}, "def2": {76, 52}, "gk": {91, 50},
			}},
			{1, [2]float64{91, 49}, map[string][2]float64{
				"scorer": {86, 49}, "def1": {78, 48}, "def2": {80, 51}, "gk": {89, 50},
			}},
		},
	}
}

func templateLongShot(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "long_shot", label: "Uzaktan şut", duration: 2800,
		frames: []rawKeyframe{
			{0, [2]float64{62, 50}, map[string][2]float64{
				"scorer": {61, 50}, "def1": {70, 46}, "def2": {72, 54}, "gk": {94, 50},
			}},
			{0.55, [2]float64{78, 48}, map[string][2]float64{
				"scorer": {63, 51}, "def1": {72, 47}, "def2": {74, 53}, "gk": {92, 49},
			}},
			{1, [2]float64{91, 47}, map[string][2]float64{
				"scorer": {64, 52}, "def1": {74, 48}, "def2": {76, 52}, "gk": {88, 48},
			}},
		},
	}
}

func templateOwnGoal(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "own_goal", label: "Kendi kalesine", duration: 2600,
		frames: []rawKeyframe{
			{0, [2]float64{88, 52}, map[string][2]float64{
				"scorer": {89, 52}, "def1": {82, 48}, "gk": {94, 50},
			}},
			{0.5, [2]float64{92, 50}, map[string][2]float64{
				"scorer": {91, 50}, "def1": {84, 49}, "gk": {93, 50},
			}},
			{1, [2]float64{95, 50}, map[string][2]float64{
				"scorer": {92, 50}, "def1": {86, 50}, "gk": {90, 50},
			}},
		},
	}
}

func buildReplayKeyframes(tpl replayTemplate, attackRight bool) []model.GoalReplayKeyframe {
	keyframes := make([]model.GoalReplayKeyframe, 0, len(tpl.frames))
	for _, f := range tpl.frames {
		kf := model.GoalReplayKeyframe{
			T:         f.t,
			Ball:      pt(f.ball[0], f.ball[1], attackRight),
			Positions: make(map[string]model.GoalReplayPoint, len(f.positions)),
		}
		for key, pos := range f.positions {
			kf.Positions[key] = pt(pos[0], pos[1], attackRight)
		}
		keyframes = append(keyframes, kf)
	}
	return keyframes
}

func pickTemplate(rng *rand.Rand, eventType, assistName string, attackRight bool) replayTemplate {
	if eventType == "own_goal" {
		return templateOwnGoal(attackRight)
	}
	if assistName != "" {
		if rng.Intn(2) == 0 {
			return templateCounter(attackRight)
		}
		return templateWideCross(attackRight)
	}
	if rng.Intn(2) == 0 {
		return templateSolo(attackRight)
	}
	return templateLongShot(attackRight)
}

// GenerateGoalReplay builds a deterministic replay scene for a goal event.
func GenerateGoalReplay(
	eventType string,
	minute int,
	playerID *int,
	playerName, assistName string,
	teamID, homeTeamID, awayTeamID int,
) *model.GoalReplayScene {
	scoringTeamID := teamID
	if eventType == "own_goal" {
		if teamID == homeTeamID {
			scoringTeamID = awayTeamID
		} else {
			scoringTeamID = homeTeamID
		}
	}

	attackRight := scoringTeamID == homeTeamID
	rng := rand.New(rand.NewSource(replaySeed(minute, playerID, teamID)))
	tpl := pickTemplate(rng, eventType, assistName, attackRight)

	scoringTeam := "home"
	oppTeam := "away"
	if scoringTeamID != homeTeamID {
		scoringTeam = "away"
		oppTeam = "home"
	}

	var actors []model.GoalReplayActor
	if assistName != "" && eventType == "goal" {
		actors = append(actors, model.GoalReplayActor{
			Key: "assister", Team: scoringTeam, Label: shortName(assistName), Role: "assister",
		})
	}
	actors = append(actors,
		model.GoalReplayActor{Key: "scorer", Team: scoringTeam, Label: shortName(playerName), Role: "scorer"},
		model.GoalReplayActor{Key: "def1", Team: oppTeam, Label: "", Role: "def"},
		model.GoalReplayActor{Key: "def2", Team: oppTeam, Label: "", Role: "def"},
		model.GoalReplayActor{Key: "gk", Team: oppTeam, Label: "GK", Role: "gk"},
	)

	caption := playerName + " · " + tpl.label
	if eventType == "own_goal" {
		caption = playerName + " (OG) · " + tpl.label
	} else if assistName != "" {
		caption = playerName + " · " + assistName + " · " + tpl.label
	}

	return &model.GoalReplayScene{
		Template:    tpl.id,
		Label:       tpl.label,
		Duration:    tpl.duration,
		Caption:     caption,
		AttackRight: attackRight,
		Actors:      actors,
		Keyframes:   buildReplayKeyframes(tpl, attackRight),
	}
}
