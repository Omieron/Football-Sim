package handler

import (
	"football-sim/internal/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MatchHandler struct {
	matchService model.MatchService
}

func NewMatchHandler(matchService model.MatchService) *MatchHandler {
	return &MatchHandler{matchService: matchService}
}

// GET /api/leagues/:id/weeks/:week
func (h *MatchHandler) GetWeek(c *gin.Context) {
	leagueID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid league id"})
		return
	}
	week, err := strconv.Atoi(c.Param("week"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid week"})
		return
	}
	matches, err := h.matchService.GetWeekMatches(leagueID, week)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": matches})
}

// POST /api/leagues/:id/weeks/:week/play
func (h *MatchHandler) PlayWeek(c *gin.Context) {
	leagueID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid league id"})
		return
	}
	week, err := strconv.Atoi(c.Param("week"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid week"})
		return
	}
	matches, err := h.matchService.PlayWeek(leagueID, week)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "week played",
		"data":    matches,
	})
}

// POST /api/leagues/:id/play-all
func (h *MatchHandler) PlayAll(c *gin.Context) {
	leagueID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid league id"})
		return
	}
	if err := h.matchService.PlayAll(leagueID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "all matches played"})
}

// GET /api/matches/:id
func (h *MatchHandler) GetMatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	events, err := h.matchService.GetMatchEvents(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": events})
}

// PUT /api/matches/:id
func (h *MatchHandler) UpdateScore(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req model.UpdateMatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	match, err := h.matchService.UpdateMatchScore(id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "score updated",
		"data":    match,
	})
}

// GET /api/leagues/:id/top-scorers
func (h *MatchHandler) GetTopScorers(c *gin.Context) {
	leagueID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid league id"})
		return
	}
	scorers, err := h.matchService.GetTopScorers(leagueID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": scorers})
}

// GET /api/matches/:id/events
func (h *MatchHandler) GetEvents(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	events, err := h.matchService.GetMatchEvents(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": events})
}