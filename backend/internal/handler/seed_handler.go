package handler

import (
	"football-sim/internal/seeder"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SeedHandler struct {
	seeder *seeder.Seeder
}

func NewSeedHandler(s *seeder.Seeder) *SeedHandler {
	return &SeedHandler{seeder: s}
}

// POST /api/admin/seed
func (h *SeedHandler) Run(c *gin.Context) {
	result, err := h.seeder.Run()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "seed completed",
		"data":    result,
	})
}
