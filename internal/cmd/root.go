// Package cmd provides the CLI commands for the manuals-webui server.
package cmd

import (
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile   string
	version   string
	gitCommit string
	buildTime string
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "manuals-webui",
	Short: "Web UI for Manuals documentation platform",
	Long: `manuals-webui provides a web interface for browsing and searching
the Manuals documentation database via the Manuals REST API.

Features:
  - Device browser with filtering
  - Full-text search
  - Pinout viewer
  - Document downloads
  - Admin panel`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() error {
	return rootCmd.Execute()
}

// SetVersionInfo sets the version information from build flags.
func SetVersionInfo(v, commit, build string) {
	version = v
	gitCommit = commit
	buildTime = build
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.manuals-webui.yaml)")
	rootCmd.PersistentFlags().String("api-url", "http://localhost:8080", "Manuals API URL")
	rootCmd.PersistentFlags().String("api-key", "", "Manuals API key")
	rootCmd.PersistentFlags().String("log-level", "info", "Log level (debug, info, warn, error)")

	_ = viper.BindPFlag("api.url", rootCmd.PersistentFlags().Lookup("api-url"))
	_ = viper.BindPFlag("api.key", rootCmd.PersistentFlags().Lookup("api-key"))
	_ = viper.BindPFlag("log.level", rootCmd.PersistentFlags().Lookup("log-level"))
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		viper.AddConfigPath(home)
		viper.AddConfigPath(".")
		viper.SetConfigType("yaml")
		viper.SetConfigName(".manuals-webui")
	}

	// Environment variables
	viper.SetEnvPrefix("MANUALS")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Read config file if it exists
	if err := viper.ReadInConfig(); err == nil {
		slog.Debug("using config file", "path", viper.ConfigFileUsed())
	}
}

func setupLogger() *slog.Logger {
	level := slog.LevelInfo
	switch strings.ToLower(viper.GetString("log.level")) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	handler := slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: level,
	})

	return slog.New(handler)
}

func getVersionString() string {
	return fmt.Sprintf("%s (commit: %s, built: %s)", version, gitCommit, buildTime)
}
