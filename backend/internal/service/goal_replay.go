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
		id: "counter", label: "Counter attack", duration: 3200,
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
		id: "wide_cross", label: "Cross & finish", duration: 3600,
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

func templateCornerTop(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "corner_top", label: "Corner (header)", duration: 3400,
		frames: []rawKeyframe{
			{0, [2]float64{94, 10}, map[string][2]float64{
				"assister": {93, 8}, "scorer": {84, 46}, "def1": {86, 38}, "def2": {88, 52}, "gk": {94, 50},
			}},
			{0.42, [2]float64{88, 38}, map[string][2]float64{
				"assister": {93, 10}, "scorer": {85, 44}, "def1": {87, 40}, "def2": {89, 50}, "gk": {93, 49},
			}},
			{0.78, [2]float64{90, 47}, map[string][2]float64{
				"assister": {93, 12}, "scorer": {87, 47}, "def1": {88, 42}, "def2": {90, 51}, "gk": {91, 50},
			}},
			{1, [2]float64{92, 48}, map[string][2]float64{
				"assister": {93, 12}, "scorer": {88, 48}, "def1": {89, 44}, "def2": {90, 52}, "gk": {89, 49},
			}},
		},
	}
}

func templateCornerBottom(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "corner_bottom", label: "Corner (header)", duration: 3400,
		frames: []rawKeyframe{
			{0, [2]float64{94, 90}, map[string][2]float64{
				"assister": {93, 92}, "scorer": {84, 54}, "def1": {86, 62}, "def2": {88, 48}, "gk": {94, 50},
			}},
			{0.42, [2]float64{88, 62}, map[string][2]float64{
				"assister": {93, 90}, "scorer": {85, 52}, "def1": {87, 58}, "def2": {89, 50}, "gk": {93, 51},
			}},
			{0.78, [2]float64{90, 53}, map[string][2]float64{
				"assister": {93, 88}, "scorer": {87, 53}, "def1": {88, 56}, "def2": {90, 49}, "gk": {91, 50},
			}},
			{1, [2]float64{92, 52}, map[string][2]float64{
				"assister": {93, 88}, "scorer": {88, 52}, "def1": {89, 54}, "def2": {90, 48}, "gk": {89, 51},
			}},
		},
	}
}

func templateThroughBall(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "through_ball", label: "Through ball", duration: 3000,
		frames: []rawKeyframe{
			{0, [2]float64{58, 50}, map[string][2]float64{
				"assister": {56, 50}, "scorer": {72, 44}, "def1": {64, 48}, "def2": {66, 54}, "gk": {94, 50},
			}},
			{0.35, [2]float64{72, 44}, map[string][2]float64{
				"assister": {58, 51}, "scorer": {76, 44}, "def1": {68, 46}, "def2": {70, 52}, "gk": {93, 49},
			}},
			{0.72, [2]float64{86, 46}, map[string][2]float64{
				"assister": {60, 52}, "scorer": {84, 46}, "def1": {76, 47}, "def2": {78, 51}, "gk": {91, 50},
			}},
			{1, [2]float64{91, 47}, map[string][2]float64{
				"assister": {62, 52}, "scorer": {87, 47}, "def1": {80, 48}, "def2": {82, 50}, "gk": {88, 49},
			}},
		},
	}
}

func templateCutback(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "cutback", label: "Cutback & finish", duration: 3200,
		frames: []rawKeyframe{
			{0, [2]float64{90, 22}, map[string][2]float64{
				"assister": {88, 20}, "scorer": {82, 50}, "def1": {86, 30}, "def2": {84, 48}, "gk": {94, 50},
			}},
			{0.4, [2]float64{88, 38}, map[string][2]float64{
				"assister": {89, 24}, "scorer": {83, 50}, "def1": {87, 34}, "def2": {85, 49}, "gk": {93, 50},
			}},
			{0.75, [2]float64{86, 48}, map[string][2]float64{
				"assister": {90, 28}, "scorer": {85, 48}, "def1": {88, 40}, "def2": {86, 50}, "gk": {91, 51},
			}},
			{1, [2]float64{91, 49}, map[string][2]float64{
				"assister": {90, 32}, "scorer": {86, 49}, "def1": {89, 42}, "def2": {87, 51}, "gk": {89, 50},
			}},
		},
	}
}

func templateLowCross(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "low_cross", label: "Low cross", duration: 3300,
		frames: []rawKeyframe{
			{0, [2]float64{78, 82}, map[string][2]float64{
				"assister": {76, 84}, "scorer": {86, 50}, "def1": {80, 72}, "def2": {84, 54}, "gk": {94, 50},
			}},
			{0.45, [2]float64{86, 58}, map[string][2]float64{
				"assister": {77, 82}, "scorer": {87, 50}, "def1": {82, 64}, "def2": {85, 52}, "gk": {93, 49},
			}},
			{1, [2]float64{91, 50}, map[string][2]float64{
				"assister": {78, 80}, "scorer": {88, 50}, "def1": {84, 58}, "def2": {86, 51}, "gk": {89, 50},
			}},
		},
	}
}

func templatePenalty(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "penalty", label: "Penalty", duration: 2800,
		frames: []rawKeyframe{
			{0, [2]float64{84, 50}, map[string][2]float64{
				"scorer": {78, 50}, "def1": {86, 46}, "gk": {94, 50},
			}},
			{0.35, [2]float64{84, 50}, map[string][2]float64{
				"scorer": {82, 50}, "def1": {86, 46}, "gk": {93, 48},
			}},
			{0.65, [2]float64{88, 48}, map[string][2]float64{
				"scorer": {83, 49}, "def1": {86, 46}, "gk": {92, 46},
			}},
			{1, [2]float64{92, 46}, map[string][2]float64{
				"scorer": {84, 48}, "def1": {86, 46}, "gk": {90, 44},
			}},
		},
	}
}

func templateFreeKick(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "free_kick", label: "Free kick", duration: 3200,
		frames: []rawKeyframe{
			{0, [2]float64{70, 52}, map[string][2]float64{
				"scorer": {68, 52}, "def1": {76, 48}, "def2": {76, 54}, "gk": {94, 50},
			}},
			{0.4, [2]float64{78, 46}, map[string][2]float64{
				"scorer": {69, 53}, "def1": {76, 48}, "def2": {76, 54}, "gk": {93, 48},
			}},
			{0.75, [2]float64{88, 44}, map[string][2]float64{
				"scorer": {70, 54}, "def1": {77, 49}, "def2": {77, 53}, "gk": {91, 46},
			}},
			{1, [2]float64{92, 43}, map[string][2]float64{
				"scorer": {71, 54}, "def1": {78, 50}, "def2": {78, 52}, "gk": {88, 44},
			}},
		},
	}
}

func templateVolley(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "volley", label: "Volley", duration: 2600,
		frames: []rawKeyframe{
			{0, [2]float64{82, 38}, map[string][2]float64{
				"scorer": {80, 46}, "def1": {84, 42}, "def2": {86, 50}, "gk": {94, 50},
			}},
			{0.45, [2]float64{86, 44}, map[string][2]float64{
				"scorer": {81, 47}, "def1": {85, 43}, "def2": {87, 49}, "gk": {92, 48},
			}},
			{1, [2]float64{91, 48}, map[string][2]float64{
				"scorer": {82, 48}, "def1": {86, 44}, "def2": {88, 50}, "gk": {89, 47},
			}},
		},
	}
}

func templateTapIn(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "tap_in", label: "Tap-in", duration: 2200,
		frames: []rawKeyframe{
			{0, [2]float64{88, 50}, map[string][2]float64{
				"scorer": {86, 50}, "def1": {84, 48}, "gk": {94, 51},
			}},
			{0.5, [2]float64{90, 50}, map[string][2]float64{
				"scorer": {88, 50}, "def1": {85, 49}, "gk": {93, 50},
			}},
			{1, [2]float64{92, 50}, map[string][2]float64{
				"scorer": {89, 50}, "def1": {86, 50}, "gk": {91, 50},
			}},
		},
	}
}

func templateLeftChannel(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "left_channel", label: "Left channel", duration: 3100,
		frames: []rawKeyframe{
			{0, [2]float64{62, 28}, map[string][2]float64{
				"scorer": {62, 28}, "def1": {68, 32}, "def2": {70, 44}, "gk": {94, 50},
			}},
			{0.45, [2]float64{76, 32}, map[string][2]float64{
				"scorer": {76, 32}, "def1": {72, 34}, "def2": {74, 42}, "gk": {93, 49},
			}},
			{0.78, [2]float64{88, 38}, map[string][2]float64{
				"scorer": {86, 38}, "def1": {78, 38}, "def2": {80, 44}, "gk": {91, 48},
			}},
			{1, [2]float64{91, 40}, map[string][2]float64{
				"scorer": {87, 40}, "def1": {80, 40}, "def2": {82, 46}, "gk": {89, 47},
			}},
		},
	}
}

func templateRightChannel(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "right_channel", label: "Right channel", duration: 3100,
		frames: []rawKeyframe{
			{0, [2]float64{62, 72}, map[string][2]float64{
				"scorer": {62, 72}, "def1": {68, 68}, "def2": {70, 56}, "gk": {94, 50},
			}},
			{0.45, [2]float64{76, 68}, map[string][2]float64{
				"scorer": {76, 68}, "def1": {72, 66}, "def2": {74, 58}, "gk": {93, 51},
			}},
			{0.78, [2]float64{88, 62}, map[string][2]float64{
				"scorer": {86, 62}, "def1": {78, 62}, "def2": {80, 56}, "gk": {91, 52},
			}},
			{1, [2]float64{91, 60}, map[string][2]float64{
				"scorer": {87, 60}, "def1": {80, 60}, "def2": {82, 54}, "gk": {89, 53},
			}},
		},
	}
}

func templateSolo(attackRight bool) replayTemplate {
	return replayTemplate{
		id: "solo", label: "Solo dribble", duration: 3000,
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
		id: "long_shot", label: "Long shot", duration: 2800,
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
		id: "own_goal", label: "Own goal", duration: 2600,
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
	return templateByMethod(PickGoalMethod(rng, eventType, assistName), attackRight)
}

// PickGoalMethod chooses how the goal was scored (drives replay + assist logic).
func PickGoalMethod(rng *rand.Rand, eventType, assistName string) string {
	if eventType == "own_goal" {
		return "own_goal"
	}
	// Legacy events already stored with assist — keep compatible replay type
	if assistName != "" {
		assisted := []string{
			"counter", "wide_cross", "corner_top", "corner_bottom",
			"through_ball", "cutback", "low_cross",
		}
		return assisted[rng.Intn(len(assisted))]
	}
	// Set-piece goals never have an assister
	r := rng.Float64()
	switch {
	case r < 0.06:
		return "penalty"
	case r < 0.11:
		return "free_kick"
	}
	// ~55% of remaining goals get an assist (overall ~49% assisted incl. pen/FK)
	if rng.Float64() < 0.55 {
		return pickAssistedMethod(rng)
	}
	return pickSoloMethod(rng)
}

func pickAssistedMethod(rng *rand.Rand) string {
	r := rng.Float64()
	switch {
	case r < 0.18:
		return "counter"
	case r < 0.36:
		return "wide_cross"
	case r < 0.50:
		return "through_ball"
	case r < 0.62:
		return "corner_top"
	case r < 0.74:
		return "corner_bottom"
	case r < 0.87:
		return "low_cross"
	default:
		return "cutback"
	}
}

func pickSoloMethod(rng *rand.Rand) string {
	r := rng.Float64()
	switch {
	case r < 0.22:
		return "solo"
	case r < 0.40:
		return "long_shot"
	case r < 0.55:
		return "left_channel"
	case r < 0.70:
		return "right_channel"
	case r < 0.82:
		return "volley"
	default:
		return "tap_in"
	}
}

// GoalMethodUsesAssist reports whether this goal type should have an assister.
func GoalMethodUsesAssist(method string) bool {
	switch method {
	case "counter", "wide_cross", "through_ball", "cutback", "low_cross", "corner_top", "corner_bottom":
		return true
	default:
		return false
	}
}

func templateByMethod(method string, attackRight bool) replayTemplate {
	switch method {
	case "own_goal":
		return templateOwnGoal(attackRight)
	case "penalty":
		return templatePenalty(attackRight)
	case "free_kick":
		return templateFreeKick(attackRight)
	case "corner_top":
		return templateCornerTop(attackRight)
	case "corner_bottom":
		return templateCornerBottom(attackRight)
	case "solo":
		return templateSolo(attackRight)
	case "long_shot":
		return templateLongShot(attackRight)
	case "volley":
		return templateVolley(attackRight)
	case "tap_in":
		return templateTapIn(attackRight)
	case "left_channel":
		return templateLeftChannel(attackRight)
	case "right_channel":
		return templateRightChannel(attackRight)
	case "counter":
		return templateCounter(attackRight)
	case "wide_cross":
		return templateWideCross(attackRight)
	case "through_ball":
		return templateThroughBall(attackRight)
	case "cutback":
		return templateCutback(attackRight)
	case "low_cross":
		return templateLowCross(attackRight)
	default:
		return templateSolo(attackRight)
	}
}

// GenerateGoalReplay builds a deterministic replay scene for a goal event.
func GenerateGoalReplay(
	eventType string,
	minute int,
	playerID *int,
	playerName, assistName string,
	teamID, homeTeamID, awayTeamID int,
	method string,
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
	tpl := templateByMethod(method, attackRight)

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
