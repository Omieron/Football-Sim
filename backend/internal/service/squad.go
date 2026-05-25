package service

import (
	"football-sim/internal/model"
	"sort"
	"strings"
)

var autoSquadPrefixes = []string{"Defender ", "Midfielder ", "Forward "}

func isAutoSquadName(name string) bool {
	if name == "Goalkeeper" {
		return true
	}
	for _, prefix := range autoSquadPrefixes {
		if strings.HasPrefix(name, prefix) {
			return true
		}
	}
	return false
}

// filterRealSquad drops placeholder names when the team has a real imported roster.
func filterRealSquad(players []model.Player) []model.Player {
	var real []model.Player
	for _, p := range players {
		if !isAutoSquadName(p.Name) {
			real = append(real, p)
		}
	}
	if len(real) >= 11 {
		return real
	}
	return players
}

// matchdaySquad picks a realistic starting XI so goals concentrate on real starters.
func matchdaySquad(players []model.Player) []model.Player {
	if len(players) == 0 {
		return players
	}

	byPos := map[string][]model.Player{}
	for _, p := range players {
		pos := p.Position
		if pos == "" {
			pos = "MID"
		}
		byPos[pos] = append(byPos[pos], p)
	}
	for pos := range byPos {
		sort.Slice(byPos[pos], func(i, j int) bool {
			return byPos[pos][i].ID < byPos[pos][j].ID
		})
	}

	want := map[string]int{"GK": 1, "DEF": 4, "MID": 4, "FWD": 2}
	order := []string{"GK", "DEF", "MID", "FWD"}

	var squad []model.Player
	for _, pos := range order {
		group := byPos[pos]
		n := want[pos]
		if len(group) < n {
			n = len(group)
		}
		squad = append(squad, group[:n]...)
	}

	if len(squad) == 0 {
		return players
	}
	return squad
}

func scoringRanks(squad []model.Player) (fwdRank, midRank map[int]int) {
	fwdRank = map[int]int{}
	midRank = map[int]int{}

	var fwds, mids []model.Player
	for _, p := range squad {
		switch p.Position {
		case "FWD":
			fwds = append(fwds, p)
		case "MID":
			mids = append(mids, p)
		}
	}
	sort.Slice(fwds, func(i, j int) bool { return fwds[i].ID < fwds[j].ID })
	sort.Slice(mids, func(i, j int) bool { return mids[i].ID < mids[j].ID })

	for i, p := range fwds {
		fwdRank[p.ID] = i
	}
	for i, p := range mids {
		midRank[p.ID] = i
	}
	return fwdRank, midRank
}
