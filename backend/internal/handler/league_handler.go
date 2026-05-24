package handler

import (
	"football-sim/internal/model"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type LeagueHandler struct {
	leagueService model.LeagueService
}

func NewLeagueHandler(leagueService model.LeagueService) *LeagueHandler {
	return &LeagueHandler{leagueService: leagueService}
}

// GET /api/leagues
func (h *LeagueHandler) GetAll(c *gin.Context) {
	leagues, err := h.leagueService.GetAllLeagues()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": leagues})
}

// GET /api/leagues/:id
func (h *LeagueHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "geçersiz id"})
		return
	}
	league, err := h.leagueService.GetLeague(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": league})
}

// POST /api/leagues
func (h *LeagueHandler) Create(c *gin.Context) {
	var req model.CreateLeagueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	league, err := h.leagueService.CreateLeague(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": league})
}

// DELETE /api/leagues/:id/reset
func (h *LeagueHandler) Reset(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "geçersiz id"})
		return
	}
	if err := h.leagueService.ResetLeague(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "lig sıfırlandı"})
}

// GET /api/leagues/:id/standings
func (h *LeagueHandler) GetStandings(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "geçersiz id"})
		return
	}
	standings, err := h.leagueService.GetStandings(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": standings})
}

// GET /api/leagues/:id/fixtures
func (h *LeagueHandler) GetFixtures(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "geçersiz id"})
		return
	}
	fixtures, err := h.leagueService.GetFixtures(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": fixtures})
}

// GET /api/leagues/:id/predictions
func (h *LeagueHandler) GetPredictions(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "geçersiz id"})
		return
	}
	predictions, err := h.leagueService.GetPredictions(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": predictions})
}