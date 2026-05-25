package seeder

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

const espnBase = "https://site.api.espn.com/apis/site/v2/sports/soccer"

// ─── ESPN Response Types ──────────────────────────────────────────────────────

type espnTeamsResponse struct {
	Sports []struct {
		Leagues []struct {
			Teams []struct {
				Team espnTeam `json:"team"`
			} `json:"teams"`
		} `json:"leagues"`
	} `json:"sports"`
}

type espnTeam struct {
	ID           string `json:"id"`
	DisplayName  string `json:"displayName"`
	Abbreviation string `json:"abbreviation"`
}

type espnRosterResponse struct {
	Athletes []espnPlayer `json:"athletes"`
}

type espnPlayer struct {
	FullName string `json:"fullName"`
	Position struct {
		Abbreviation string `json:"abbreviation"`
	} `json:"position"`
}

// ─── League Config ────────────────────────────────────────────────────────────

type LeagueConfig struct {
	Name         string
	ESPNCode     string // ESPN league slug
	BaseAttack   int
	BaseDefense  int
	AttackDecay  int
	DefenseDecay int
}

var AllLeagues = []LeagueConfig{
	{Name: "English Premier League", ESPNCode: "eng.1", BaseAttack: 88, BaseDefense: 85, AttackDecay: 2, DefenseDecay: 2},
	{Name: "La Liga",                ESPNCode: "esp.1", BaseAttack: 87, BaseDefense: 84, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Bundesliga",             ESPNCode: "ger.1", BaseAttack: 86, BaseDefense: 83, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Serie A",                ESPNCode: "ita.1", BaseAttack: 85, BaseDefense: 82, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Ligue 1",                ESPNCode: "fra.1", BaseAttack: 84, BaseDefense: 81, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Süper Lig",              ESPNCode: "tur.1", BaseAttack: 80, BaseDefense: 77, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Eredivisie",             ESPNCode: "ned.1", BaseAttack: 79, BaseDefense: 76, AttackDecay: 2, DefenseDecay: 2},
	{Name: "Primeira Liga",          ESPNCode: "por.1", BaseAttack: 78, BaseDefense: 75, AttackDecay: 2, DefenseDecay: 2},
	{Name: "English Championship",   ESPNCode: "eng.2", BaseAttack: 72, BaseDefense: 70, AttackDecay: 1, DefenseDecay: 1},
	{Name: "Scottish Premiership",   ESPNCode: "sco.1", BaseAttack: 70, BaseDefense: 68, AttackDecay: 2, DefenseDecay: 2},
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

func (s *Seeder) Run(codes []string) (Result, error) {
	var result Result

	leagues := AllLeagues
	if len(codes) > 0 {
		codeSet := make(map[string]bool, len(codes))
		for _, c := range codes {
			codeSet[c] = true
		}
		filtered := leagues[:0]
		for _, l := range leagues {
			if codeSet[l.ESPNCode] {
				filtered = append(filtered, l)
			}
		}
		leagues = filtered
	}

	for _, league := range leagues {
		log.Printf("Fetching teams for %s...", league.Name)

		teams, err := s.fetchTeams(league.ESPNCode)
		if err != nil {
			log.Printf("Could not fetch teams for %s: %v", league.Name, err)
			continue
		}

		log.Printf("Found %d teams", len(teams))

		for i, team := range teams {
			attack := league.BaseAttack - (i * league.AttackDecay)
			defense := league.BaseDefense - (i * league.DefenseDecay)
			if attack < 40 {
				attack = 40
			}
			if defense < 40 {
				defense = 40
			}

			teamID, err := s.upsertTeam(team.DisplayName, team.Abbreviation, "", attack, defense)
			if err != nil {
				log.Printf("Could not insert team %s: %v", team.DisplayName, err)
				continue
			}

			log.Printf("%s (ATK:%d DEF:%d)", team.DisplayName, attack, defense)
			result.TotalTeams++

			players, err := s.fetchRoster(league.ESPNCode, team.ID)
			if err != nil {
				log.Printf("Could not fetch roster for %s: %v", team.DisplayName, err)
				continue
			}

			playerCount := 0
			for _, p := range players {
				if p.FullName == "" {
					continue
				}
				pos := normalizePosition(p.Position.Abbreviation)
				if err := s.insertPlayer(teamID, p.FullName, pos); err != nil {
					continue
				}
				playerCount++
				result.TotalPlayers++
			}

			log.Printf("  → %d players inserted", playerCount)

			// Respect ESPN rate limits
			time.Sleep(200 * time.Millisecond)
		}

		log.Printf("%s done", league.Name)
	}

	return result, nil
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

func (s *Seeder) fetchTeams(leagueCode string) ([]espnTeam, error) {
	url := fmt.Sprintf("%s/%s/teams", espnBase, leagueCode)
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch teams: %w", err)
	}
	defer resp.Body.Close()

	var result espnTeamsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode teams: %w", err)
	}

	if len(result.Sports) == 0 || len(result.Sports[0].Leagues) == 0 {
		return nil, fmt.Errorf("no leagues in response")
	}

	raw := result.Sports[0].Leagues[0].Teams
	teams := make([]espnTeam, 0, len(raw))
	for _, t := range raw {
		teams = append(teams, t.Team)
	}
	return teams, nil
}

func (s *Seeder) fetchRoster(leagueCode, teamID string) ([]espnPlayer, error) {
	url := fmt.Sprintf("%s/%s/teams/%s/roster", espnBase, leagueCode, teamID)
	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch roster: %w", err)
	}
	defer resp.Body.Close()

	var result espnRosterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode roster: %w", err)
	}
	return result.Athletes, nil
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

func normalizePosition(pos string) string {
	switch pos {
	case "G", "GK":
		return "GK"
	case "D", "CB", "LB", "RB", "LWB", "RWB":
		return "DEF"
	case "M", "CM", "DM", "AM", "LM", "RM":
		return "MID"
	case "F", "CF", "LW", "RW", "ST", "SS":
		return "FWD"
	default:
		return "MID"
	}
}
