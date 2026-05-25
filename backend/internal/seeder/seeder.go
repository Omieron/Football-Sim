package seeder

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const baseURL = "https://www.thesportsdb.com/api/v1/json/123"

// ─── API Response Types ───────────────────────────────────────────────────────

type APITeam struct {
	IDTeam       string `json:"idTeam"`
	StrTeam      string `json:"strTeam"`
	StrTeamShort string `json:"strTeamShort"`
	StrBadge     string `json:"strBadge"`
}

type APITeamsResponse struct {
	Teams []APITeam `json:"teams"`
}

type APIPlayer struct {
	IDPlayer    string `json:"idPlayer"`
	StrPlayer   string `json:"strPlayer"`
	StrPosition string `json:"strPosition"`
	IDTeam      string `json:"idTeam"`
}

type APIPlayersResponse struct {
	Player []APIPlayer `json:"player"`
}

// ─── League Config ────────────────────────────────────────────────────────────

type LeagueConfig struct {
	Name         string
	APIName      string // name used in TheSportsDB
	BaseAttack   int    // attack rating of the strongest team
	BaseDefense  int    // defense rating of the strongest team
	AttackDecay  int    // attack points lost per rank
	DefenseDecay int    // defense points lost per rank
}

var defaultLeagues = []LeagueConfig{
	{
		Name:         "English Premier League",
		APIName:      "English_Premier_League",
		BaseAttack:   88,
		BaseDefense:  85,
		AttackDecay:  2,
		DefenseDecay: 2,
	},
	{
		Name:         "English Championship",
		APIName:      "English_Championship",
		BaseAttack:   72,
		BaseDefense:  70,
		AttackDecay:  1,
		DefenseDecay: 1,
	},
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

type Result struct {
	TotalTeams   int `json:"total_teams"`
	TotalPlayers int `json:"total_players"`
}

type Seeder struct {
	db         *sql.DB
	httpClient *http.Client
}

func New(db *sql.DB) *Seeder {
	return &Seeder{
		db:         db,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Seeder) Run() (Result, error) {
	var result Result

	for _, league := range defaultLeagues {
		log.Printf("Fetching teams for %s...", league.Name)

		teams, err := s.fetchTeams(league.APIName)
		if err != nil {
			log.Printf("Could not fetch teams for %s: %v", league.Name, err)
			continue
		}

		log.Printf("Found %d teams", len(teams))

		for i, apiTeam := range teams {
			// Attack/defense decreases by rank; first team is strongest
			attack := league.BaseAttack - (i * league.AttackDecay)
			defense := league.BaseDefense - (i * league.DefenseDecay)

			// Floor at 40
			if attack < 40 {
				attack = 40
			}
			if defense < 40 {
				defense = 40
			}

			// Append /small to get the thumbnail badge
			crestURL := apiTeam.StrBadge
			if crestURL != "" {
				crestURL += "/small"
			}

			teamID, err := s.upsertTeam(apiTeam.StrTeam, apiTeam.StrTeamShort, crestURL, attack, defense)
			if err != nil {
				log.Printf("Could not insert team %s: %v", apiTeam.StrTeam, err)
				continue
			}

			log.Printf("%s (ATK:%d DEF:%d)", apiTeam.StrTeam, attack, defense)
			result.TotalTeams++

			// Wait 300ms between requests to respect rate limit
			time.Sleep(300 * time.Millisecond)

			players, err := s.fetchPlayers(apiTeam.IDTeam)
			if err != nil {
				log.Printf("Could not fetch players: %v", err)
				continue
			}

			playerCount := 0
			for _, p := range players {
				if p.StrPlayer == "" {
					continue
				}
				pos := normalizePosition(p.StrPosition)
				if err := s.insertPlayer(teamID, p.StrPlayer, pos); err != nil {
					continue
				}
				playerCount++
				result.TotalPlayers++
			}

			log.Printf("%d players inserted", playerCount)

			// Rate limit: ~30 requests per minute → wait 2 seconds
			time.Sleep(2 * time.Second)
		}

		log.Printf("%s done\n", league.Name)
	}

	return result, nil
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

func (s *Seeder) fetchTeams(leagueName string) ([]APITeam, error) {
	url := fmt.Sprintf("%s/search_all_teams.php?l=%s", baseURL, leagueName)
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch teams: %w", err)
	}
	defer resp.Body.Close()

	var result APITeamsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode teams: %w", err)
	}
	return result.Teams, nil
}

func (s *Seeder) fetchPlayers(teamID string) ([]APIPlayer, error) {
	url := fmt.Sprintf("%s/lookup_all_players.php?id=%s", baseURL, teamID)
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch players: %w", err)
	}
	defer resp.Body.Close()

	var result APIPlayersResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode players: %w", err)
	}
	return result.Player, nil
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

func (s *Seeder) upsertTeam(name, shortName, crestURL string, attack, defense int) (int, error) {
	var id int
	err := s.db.QueryRow(`
		INSERT INTO teams (name, short_name, crest_url, attack, defense)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (name) DO UPDATE
		SET short_name = EXCLUDED.short_name,
		    crest_url  = EXCLUDED.crest_url,
		    attack     = EXCLUDED.attack,
		    defense    = EXCLUDED.defense
		RETURNING id`,
		name, shortName, crestURL, attack, defense,
	).Scan(&id)
	return id, err
}

func (s *Seeder) insertPlayer(teamID int, name, position string) error {
	_, err := s.db.Exec(`
		INSERT INTO players (team_id, name, position)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING`,
		teamID, name, position,
	)
	return err
}

// ─── Position Normalizer ──────────────────────────────────────────────────────

// normalizePosition maps TheSportsDB position names to our internal codes
func normalizePosition(pos string) string {
	switch pos {
	case "Goalkeeper", "GoalKeeper", "GK":
		return "GK"
	case "Defender", "Centre-Back", "Left-Back", "Right-Back", "Wingback":
		return "DEF"
	case "Midfielder", "Central Midfield", "Defensive Midfield",
		"Attacking Midfield", "Left Midfield", "Right Midfield":
		return "MID"
	case "Forward", "Centre-Forward", "Left Winger", "Right Winger",
		"Second Striker", "Striker", "Attacker":
		return "FWD"
	default:
		return "MID" // unknown position defaults to midfielder
	}
}
