// manuals-webui - Web UI for Manuals documentation platform
package main

import (
	"log/slog"
	"os"

	"github.com/rmrfslashbin/manuals-webui/internal/cmd"
)

var (
	version   = "dev"
	gitCommit = "unknown"
	buildTime = "unknown"
)

func main() {
	// Set version info
	cmd.SetVersionInfo(version, gitCommit, buildTime)

	// Run the CLI
	if err := cmd.Execute(); err != nil {
		slog.Error("fatal error", "error", err)
		os.Exit(1)
	}
}
