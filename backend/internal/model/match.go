package model

import "time"

type Match struct {
	ID           int       `json:"id"`
	LeagueID     int       `json:"league_id"`
	Week         int       `json:"week"`
	HomeTeamID   int       `json:"home_team_id"`
	HomeTeamName string    `json:"home_team_name,omitempty"`
	HomeCrestURL string    `json:"home_crest_url,omitempty"`
	AwayTeamID   int       `json:"away_team_id"`
	AwayTeamName string    `json:"away_team_name,omitempty"`
	AwayCrestURL string    `json:"away_crest_url,omitempty"`
	HomeGoals    int       `json:"home_goals"`
	AwayGoals    int       `json:"away_goals"`
	Played       bool      `json:"played"`
	CreatedAt    time.Time `json:"created_at"`
	Events       []MatchEvent `json:"events,omitempty"`
}

type MatchEvent struct {
	ID               int       `json:"id"`
	MatchID          int       `json:"match_id"`
	PlayerID         *int      `json:"player_id,omitempty"`
	PlayerName       string    `json:"player_name,omitempty"`
	AssistPlayerID   *int      `json:"assist_player_id,omitempty"`
	AssistPlayerName string    `json:"assist_player_name,omitempty"`
	Position         string    `json:"position,omitempty"`
	TeamID           int       `json:"team_id"`
	TeamName         string    `json:"team_name,omitempty"`
	Type             string    `json:"type"` // goal, own_goal, yellow_card, red_card, offside, substitution, var_cancelled_goal, injury
	Minute           int       `json:"minute"`
	GoalReplay       *GoalReplayScene `json:"goal_replay,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

// GoalReplayScene is persisted at simulation time and replayed by the frontend.
type GoalReplayScene struct {
	Template    string               `json:"template"`
	Label       string               `json:"label"`
	Duration    int                  `json:"duration"`
	Caption     string               `json:"caption"`
	AttackRight bool                 `json:"attack_right"`
	Actors      []GoalReplayActor    `json:"actors"`
	Keyframes   []GoalReplayKeyframe `json:"keyframes"`
}

type GoalReplayActor struct {
	Key   string `json:"key"`
	Team  string `json:"team"`
	Label string `json:"label"`
	Role  string `json:"role"`
}

type GoalReplayKeyframe struct {
	T         float64            `json:"t"`
	Ball      GoalReplayPoint    `json:"ball"`
	Positions map[string]GoalReplayPoint `json:"positions"`
}

type GoalReplayPoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type TopScorer struct {
	PlayerName string `json:"player_name"`
	TeamName   string `json:"team_name"`
	CrestURL   string `json:"crest_url"`
	Goals      int    `json:"goals"`
}

type TopAssist struct {
	PlayerName string `json:"player_name"`
	TeamName   string `json:"team_name"`
	CrestURL   string `json:"crest_url"`
	Assists    int    `json:"assists"`
}

type MostCards struct {
	PlayerName  string `json:"player_name"`
	TeamName    string `json:"team_name"`
	CrestURL    string `json:"crest_url"`
	YellowCards int    `json:"yellow_cards"`
	RedCards    int    `json:"red_cards"`
	TotalCards  int    `json:"total_cards"`
}

type UpdateMatchRequest struct {
	HomeGoals int `json:"home_goals" binding:"min=0"`
	AwayGoals int `json:"away_goals" binding:"min=0"`
}

// MatchRepository interface
type MatchRepository interface {
	GetByID(id int) (*Match, error)
	GetByLeagueAndWeek(leagueID, week int) ([]Match, error)
	GetByLeagueID(leagueID int) ([]Match, error)
	CreateBatch(matches []Match) error
	UpdateScore(id, homeGoals, awayGoals int) error
	MarkPlayed(id int) error
	DeleteByLeagueID(leagueID int) error
	GetUnplayedWeeks(leagueID int) ([]int, error)
}

// MatchEventRepository interface
type MatchEventRepository interface {
	GetByMatchID(matchID int) ([]MatchEvent, error)
	CreateBatch(events []MatchEvent) error
	DeleteByMatchID(matchID int) error
	DeleteByID(matchID, eventID int) error
	GetTopScorers(leagueID int, limit int) ([]TopScorer, error)
	GetTopAssists(leagueID int, limit int) ([]TopAssist, error)
	GetMostCards(leagueID int, limit int) ([]MostCards, error)
}

// MatchService interface
type MatchService interface {
	GetWeekMatches(leagueID, week int) ([]Match, error)
	PlayWeek(leagueID, week int) ([]Match, error)
	PlayAll(leagueID int) error
	UpdateMatchScore(id int, req UpdateMatchRequest) (*Match, error)
	GetMatchEvents(matchID int) ([]MatchEvent, error)
	DeleteMatchEvent(matchID, eventID int) error
	GetTopScorers(leagueID int) ([]TopScorer, error)
	GetTopAssists(leagueID int) ([]TopAssist, error)
	GetMostCards(leagueID int) ([]MostCards, error)
	RegenerateLeagueEvents(leagueID int) error
}