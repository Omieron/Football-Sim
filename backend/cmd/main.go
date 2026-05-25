package main

import (
	"football-sim/config"
	"football-sim/internal/handler"
	"football-sim/internal/middleware"
	"football-sim/internal/repository"
	"football-sim/internal/seeder"
	"football-sim/internal/service"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Config
	cfg := config.Load()

	// Database connection
	db, err := repository.NewDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	log.Println("✅ PostgreSQL connected")

	// Repositories
	teamRepo     := repository.NewTeamRepository(db)
	playerRepo   := repository.NewPlayerRepository(db)
	leagueRepo   := repository.NewLeagueRepository(db)
	matchRepo    := repository.NewMatchRepository(db)
	eventRepo    := repository.NewMatchEventRepository(db)
	standingRepo := repository.NewStandingRepository(db)

	// Services
	teamService   := service.NewTeamService(teamRepo)
	leagueService := service.NewLeagueService(leagueRepo, matchRepo, eventRepo, standingRepo, playerRepo)
	matchService  := service.NewMatchService(matchRepo, eventRepo, leagueRepo, playerRepo, teamRepo)

	// Handlers
	teamHandler   := handler.NewTeamHandler(teamService, playerRepo)
	leagueHandler := handler.NewLeagueHandler(leagueService)
	matchHandler  := handler.NewMatchHandler(matchService)
	seedHandler   := handler.NewSeedHandler(seeder.New(db))

	// Router
	r := gin.Default()
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		// Teams
		teams := api.Group("/teams")
		{
			teams.GET("",          teamHandler.GetAll)
			teams.GET("/:id",      teamHandler.GetByID)
			teams.POST("",         teamHandler.Create)
			teams.PUT("/:id",      teamHandler.Update)
			teams.DELETE("/:id",   teamHandler.Delete)
			teams.GET("/:id/players",  teamHandler.GetPlayers)
			teams.POST("/:id/players", teamHandler.AddPlayer)
		}

		// Leagues
		leagues := api.Group("/leagues")
		{
			leagues.GET("",    leagueHandler.GetAll)
			leagues.GET("/:id", leagueHandler.GetByID)
			leagues.POST("",   leagueHandler.Create)

			leagues.DELETE("/:id/reset",      leagueHandler.Reset)
			leagues.GET("/:id/standings",     leagueHandler.GetStandings)
			leagues.GET("/:id/fixtures",      leagueHandler.GetFixtures)
			leagues.GET("/:id/predictions",   leagueHandler.GetPredictions)
			leagues.GET("/:id/top-scorers",   matchHandler.GetTopScorers)
			leagues.GET("/:id/top-assists",   matchHandler.GetTopAssists)
			leagues.GET("/:id/most-cards",    matchHandler.GetMostCards)

			leagues.GET("/:id/weeks/:week",        matchHandler.GetWeek)
			leagues.POST("/:id/weeks/:week/play",  matchHandler.PlayWeek)
			leagues.POST("/:id/play-all",          matchHandler.PlayAll)
		}

		// Matches
		matches := api.Group("/matches")
		{
			matches.GET("/:id",        matchHandler.GetMatch)
			matches.PUT("/:id",        matchHandler.UpdateScore)
			matches.GET("/:id/events", matchHandler.GetEvents)
			matches.DELETE("/:id/events/:eventId", matchHandler.DeleteEvent)
		}

		// Admin
		admin := api.Group("/admin")
		{
			admin.GET("/espn-leagues", seedHandler.GetLeagues)
			admin.POST("/seed",        seedHandler.Run)
			admin.DELETE("/reset",     seedHandler.Reset)
		}
	}

	log.Printf("🚀 Server started: http://localhost:%s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}