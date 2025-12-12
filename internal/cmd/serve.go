package cmd

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rmrfslashbin/manuals-webui/internal/client"
	"github.com/rmrfslashbin/manuals-webui/internal/server"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the web UI server",
	Long:  `Start the web UI server that serves the Manuals web interface.`,
	RunE:  runServe,
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().String("host", "0.0.0.0", "Host to bind to")
	serveCmd.Flags().Int("port", 3000, "Port to listen on")

	_ = viper.BindPFlag("server.host", serveCmd.Flags().Lookup("host"))
	_ = viper.BindPFlag("server.port", serveCmd.Flags().Lookup("port"))
}

func runServe(cmd *cobra.Command, args []string) error {
	logger := setupLogger()

	// Get configuration
	apiURL := viper.GetString("api.url")
	apiKey := viper.GetString("api.key")
	host := viper.GetString("server.host")
	port := viper.GetInt("server.port")

	if apiURL == "" {
		return fmt.Errorf("MANUALS_API_URL is required")
	}

	// API key is now optional - allows anonymous read-only access
	anonymousMode := apiKey == ""
	if anonymousMode {
		logger.Info("running in anonymous mode (read-only access)")
	}

	// Create API client
	apiClient := client.New(apiURL, apiKey)

	// Verify API connection
	status, err := apiClient.GetStatus()
	if err != nil {
		return fmt.Errorf("failed to connect to API: %w", err)
	}

	logger.Info("connected to Manuals API",
		"api_version", status.APIVersion,
		"devices", status.Counts.Devices,
		"documents", status.Counts.Documents,
		"anonymous_mode", anonymousMode,
	)

	// Create server
	srv := server.New(server.Config{
		Client: apiClient,
		Logger: logger,
	})

	// Create HTTP server
	addr := fmt.Sprintf("%s:%d", host, port)
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      srv.Handler(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in background
	go func() {
		logger.Info("starting web UI server", "addr", addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown error: %w", err)
	}

	logger.Info("server stopped")
	return nil
}
