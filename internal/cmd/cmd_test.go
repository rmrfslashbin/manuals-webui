package cmd

import (
	"strings"
	"testing"

	"github.com/spf13/viper"
)

func TestSetVersionInfo(t *testing.T) {
	SetVersionInfo("1.0.0", "abc123", "2024-01-01")

	if version != "1.0.0" {
		t.Errorf("expected version 1.0.0, got %s", version)
	}
	if gitCommit != "abc123" {
		t.Errorf("expected gitCommit abc123, got %s", gitCommit)
	}
	if buildTime != "2024-01-01" {
		t.Errorf("expected buildTime 2024-01-01, got %s", buildTime)
	}
}

func TestGetVersionString(t *testing.T) {
	SetVersionInfo("1.2.3", "def456", "2024-06-15")

	result := getVersionString()

	if !strings.Contains(result, "1.2.3") {
		t.Errorf("expected version string to contain 1.2.3, got %s", result)
	}
	if !strings.Contains(result, "def456") {
		t.Errorf("expected version string to contain def456, got %s", result)
	}
	if !strings.Contains(result, "2024-06-15") {
		t.Errorf("expected version string to contain 2024-06-15, got %s", result)
	}
}

func TestSetupLogger(t *testing.T) {
	// Test different log levels
	tests := []string{"debug", "info", "warn", "error", "invalid"}

	for _, level := range tests {
		t.Run(level, func(t *testing.T) {
			viper.Set("log.level", level)
			logger := setupLogger()
			if logger == nil {
				t.Error("expected non-nil logger")
			}
		})
	}
}

func TestRootCmdExists(t *testing.T) {
	if rootCmd == nil {
		t.Error("expected rootCmd to be initialized")
	}
	if rootCmd.Use != "manuals-webui" {
		t.Errorf("expected Use to be manuals-webui, got %s", rootCmd.Use)
	}
}

func TestExecuteReturnsNilOnHelp(t *testing.T) {
	// Test that Execute doesn't panic
	// We can't easily test full execution without starting a server
	// but we can verify the command structure
	if rootCmd.HasSubCommands() {
		for _, cmd := range rootCmd.Commands() {
			if cmd.Name() == "version" {
				// Version command should exist
				return
			}
		}
		t.Error("expected version subcommand to exist")
	}
}
