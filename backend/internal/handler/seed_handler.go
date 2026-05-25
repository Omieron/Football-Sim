package handler

import (
	"football-sim/internal/seeder"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type SeedHandler struct {
	seeder *seeder.Seeder
}

func NewSeedHandler(s *seeder.Seeder) *SeedHandler {
	return &SeedHandler{seeder: s}
}

// GET /api/admin/espn-leagues
func (h *SeedHandler) GetLeagues(c *gin.Context) {
	type leagueInfo struct {
		Code     string `json:"code"`
		Name     string `json:"name"`
		Imported bool   `json:"imported"`
	}

	imported, err := h.seeder.ImportedLeagueCodes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	seen := make(map[string]struct{}, len(seeder.AllLeagues))
	leagues := make([]leagueInfo, 0, len(seeder.AllLeagues))
	for _, l := range seeder.AllLeagues {
		if _, ok := seen[l.ESPNCode]; ok {
			continue
		}
		seen[l.ESPNCode] = struct{}{}
		_, isImported := imported[l.ESPNCode]
		leagues = append(leagues, leagueInfo{
			Code:     l.ESPNCode,
			Name:     l.Name,
			Imported: isImported,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": leagues})
}

// DELETE /api/admin/reset
func (h *SeedHandler) Reset(c *gin.Context) {
	if err := h.seeder.ResetAll(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "database cleared"})
}

// POST /api/admin/seed
func (h *SeedHandler) Run(c *gin.Context) {
	var body struct {
		LeagueCodes []string `json:"league_codes"`
	}
	// body is optional — if missing, seed all
	_ = c.ShouldBindJSON(&body)

	result, err := h.seeder.Run(body.LeagueCodes)
	if err != nil {
		if strings.Contains(err.Error(), "already imported") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "seed completed",
		"data":    result,
	})
}
