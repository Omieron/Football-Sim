package service

import (
	"fmt"
	"testing"

	"football-sim/internal/model"
)

func TestGenerateFixturesDoubleRoundRobin(t *testing.T) {
	for _, n := range []int{4, 18, 20} {
		t.Run(fmt.Sprintf("teams_%d", n), func(t *testing.T) {
			teams := make([]model.Team, n)
			for i := range teams {
				teams[i] = model.Team{ID: i + 1}
			}
			matches := GenerateFixtures(1, teams)
			expectedMatches := n * (n - 1)
			expectedWeeks := (n - 1) * 2

			if len(matches) != expectedMatches {
				t.Fatalf("matches=%d want %d", len(matches), expectedMatches)
			}

			maxWeek := 0
			byWeek := map[int]int{}
			pairs := map[string]int{}
			for _, m := range matches {
				if m.Week > maxWeek {
					maxWeek = m.Week
				}
				byWeek[m.Week]++
				a, b := m.HomeTeamID, m.AwayTeamID
				if a > b {
					a, b = b, a
				}
				pairs[fmt.Sprintf("%d-%d", a, b)]++
			}

			if maxWeek != expectedWeeks {
				t.Fatalf("weeks=%d want %d", maxWeek, expectedWeeks)
			}
			for w, c := range byWeek {
				if c != n/2 {
					t.Fatalf("week %d has %d matches want %d", w, c, n/2)
				}
			}
			if len(pairs) != n*(n-1)/2 {
				t.Fatalf("unique pairings=%d", len(pairs))
			}
			for key, c := range pairs {
				if c != 2 {
					t.Fatalf("pairing %s played %d times", key, c)
				}
			}
		})
	}
}
