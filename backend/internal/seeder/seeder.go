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
	Logos        []struct {
		Href string `json:"href"`
		Rel  []string `json:"rel"`
	} `json:"logos"`
}

func (t espnTeam) CrestURL() string {
	for _, l := range t.Logos {
		for _, r := range l.Rel {
			if r == "default" || r == "full" {
				return l.Href
			}
		}
	}
	if len(t.Logos) > 0 {
		return t.Logos[0].Href
	}
	return ""
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
	Name     string
	ESPNCode string // ESPN league slug
}

var AllLeagues = []LeagueConfig{
	{Name: "English Premier League", ESPNCode: "eng.1"},
	{Name: "La Liga",                ESPNCode: "esp.1"},
	{Name: "Bundesliga",             ESPNCode: "ger.1"},
	{Name: "Serie A",                ESPNCode: "ita.1"},
	{Name: "Ligue 1",                ESPNCode: "fra.1"},
	{Name: "Süper Lig",              ESPNCode: "tur.1"},
	{Name: "Eredivisie",             ESPNCode: "ned.1"},
	{Name: "Primeira Liga",          ESPNCode: "por.1"},
	{Name: "English Championship",   ESPNCode: "eng.2"},
	{Name: "Scottish Premiership",   ESPNCode: "sco.1"},
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

func (s *Seeder) ResetAll() error {
	// Order matters — FK constraints
	tables := []string{
		"match_events",
		"matches",
		"standings",
		"league_teams",
		"leagues",
		"players",
		"teams",
		"competitions",
	}
	for _, t := range tables {
		if _, err := s.db.Exec("DELETE FROM " + t); err != nil {
			return fmt.Errorf("clearing %s: %w", t, err)
		}
	}
	return nil
}

// ImportedLeagueCodes returns ESPN codes for competitions that already have teams.
func (s *Seeder) ImportedLeagueCodes() (map[string]struct{}, error) {
	rows, err := s.db.Query(`
		SELECT c.code
		FROM competitions c
		WHERE EXISTS (SELECT 1 FROM teams t WHERE t.competition_id = c.id)`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	imported := make(map[string]struct{})
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		imported[code] = struct{}{}
	}
	return imported, rows.Err()
}

func (s *Seeder) Run(codes []string) (Result, error) {
	var result Result

	leagues := AllLeagues
	if len(codes) > 0 {
		codeSet := make(map[string]bool, len(codes))
		for _, c := range codes {
			codeSet[c] = true
		}
		filtered := make([]LeagueConfig, 0, len(codes))
		for _, l := range leagues {
			if codeSet[l.ESPNCode] {
				filtered = append(filtered, l)
			}
		}
		leagues = filtered
	}

	imported, err := s.ImportedLeagueCodes()
	if err != nil {
		return result, fmt.Errorf("checking imported leagues: %w", err)
	}

	for _, league := range leagues {
		if _, ok := imported[league.ESPNCode]; ok {
			log.Printf("Skipping %s — already imported", league.Name)
			continue
		}
		log.Printf("Fetching teams for %s...", league.Name)

		// Upsert the real-world competition record
		competitionID, err := s.upsertCompetition(league.Name, league.ESPNCode)
		if err != nil {
			log.Printf("Could not upsert competition %s: %v", league.Name, err)
			continue
		}

		teams, err := s.fetchTeams(league.ESPNCode)
		if err != nil {
			log.Printf("Could not fetch teams for %s: %v", league.Name, err)
			continue
		}

		log.Printf("Found %d teams", len(teams))

		for _, team := range teams {
			rating := LookupTeamRating(team.DisplayName, league.ESPNCode)
			attack, defense := rating.Attack, rating.Defense

			teamID, err := s.upsertTeam(team.DisplayName, team.Abbreviation, team.CrestURL(), attack, defense, competitionID)
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

func (s *Seeder) upsertCompetition(name, espnCode string) (int, error) {
	var id int
	err := s.db.QueryRow(`
		INSERT INTO competitions (name, code, country)
		VALUES ($1, $2, $3)
		ON CONFLICT (code) DO UPDATE
		SET name = EXCLUDED.name
		RETURNING id`,
		name, espnCode, countryFromCode(espnCode),
	).Scan(&id)
	return id, err
}

func (s *Seeder) upsertTeam(name, shortName, crestURL string, attack, defense, competitionID int) (int, error) {
	var id int
	err := s.db.QueryRow(`
		INSERT INTO teams (name, short_name, crest_url, attack, defense, competition_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (name) DO UPDATE
		SET short_name     = EXCLUDED.short_name,
		    crest_url      = EXCLUDED.crest_url,
		    attack         = EXCLUDED.attack,
		    defense        = EXCLUDED.defense
		RETURNING id`,
		name, shortName, crestURL, attack, defense, competitionID,
	).Scan(&id)
	return id, err
}

func (s *Seeder) insertPlayer(teamID int, name, position string) error {
	_, err := s.db.Exec(`
		INSERT INTO players (team_id, name, position)
		VALUES ($1, $2, $3)
		ON CONFLICT (team_id, name) DO NOTHING`,
		teamID, name, position,
	)
	return err
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func countryFromCode(code string) string {
	switch {
	case len(code) >= 3 && code[:3] == "eng":
		return "England"
	case len(code) >= 3 && code[:3] == "esp":
		return "Spain"
	case len(code) >= 3 && code[:3] == "ger":
		return "Germany"
	case len(code) >= 3 && code[:3] == "ita":
		return "Italy"
	case len(code) >= 3 && code[:3] == "fra":
		return "France"
	case len(code) >= 3 && code[:3] == "tur":
		return "Turkey"
	case len(code) >= 3 && code[:3] == "ned":
		return "Netherlands"
	case len(code) >= 3 && code[:3] == "por":
		return "Portugal"
	case len(code) >= 3 && code[:3] == "sco":
		return "Scotland"
	default:
		return "Unknown"
	}
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
