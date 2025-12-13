package server

import (
	"bytes"
	"html"
	"html/template"
	"strings"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	goldmarkhtml "github.com/yuin/goldmark/renderer/html"
)

// MarkdownRenderer provides markdown to HTML conversion with sanitization.
type MarkdownRenderer struct {
	goldmark  goldmark.Markdown
	sanitizer *bluemonday.Policy
}

// newMarkdownRenderer creates a new markdown renderer with GitHub Flavored Markdown support.
func newMarkdownRenderer() *MarkdownRenderer {
	// Configure Goldmark with GitHub Flavored Markdown extensions
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,          // GitHub Flavored Markdown
			extension.Table,        // Tables
			extension.Strikethrough, // ~~strikethrough~~
			extension.TaskList,     // - [ ] task lists
			extension.Linkify,      // Auto-link URLs
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(), // Auto-generate heading IDs for anchoring
		),
		goldmark.WithRendererOptions(
			goldmarkhtml.WithHardWraps(), // Convert line breaks to <br>
			goldmarkhtml.WithXHTML(),     // Render as XHTML
		),
	)

	// Create Bluemonday UGC (User Generated Content) policy
	// This allows safe HTML elements and strips dangerous content
	policy := bluemonday.UGCPolicy()

	// Additional security: add nofollow and noreferrer to links
	policy.RequireNoFollowOnLinks(true)
	policy.RequireNoReferrerOnLinks(true)
	policy.AllowRelativeURLs(true)
	policy.AddTargetBlankToFullyQualifiedLinks(true)

	return &MarkdownRenderer{
		goldmark:  md,
		sanitizer: policy,
	}
}

// RenderMarkdown converts markdown content to safe HTML.
// Returns template.HTML to prevent double-escaping by Go templates.
func (mr *MarkdownRenderer) RenderMarkdown(content string) template.HTML {
	if content == "" {
		return template.HTML("")
	}

	var buf bytes.Buffer
	if err := mr.goldmark.Convert([]byte(content), &buf); err != nil {
		// On error, return escaped content as fallback
		return template.HTML("<p>" + html.EscapeString(content) + "</p>")
	}

	// Sanitize HTML output to prevent XSS attacks
	sanitized := mr.sanitizer.Sanitize(buf.String())

	return template.HTML(sanitized)
}

// RenderMarkdownInline converts markdown to HTML and strips block-level elements.
// Useful for rendering inline snippets in search results.
func (mr *MarkdownRenderer) RenderMarkdownInline(content string) template.HTML {
	if content == "" {
		return template.HTML("")
	}

	// First render markdown normally
	rendered := mr.RenderMarkdown(content)
	str := string(rendered)

	// Strip block-level elements but keep inline formatting
	// Remove <p> tags but keep their content
	str = strings.ReplaceAll(str, "<p>", "")
	str = strings.ReplaceAll(str, "</p>", " ")

	// Remove other block elements
	str = strings.ReplaceAll(str, "<pre>", "")
	str = strings.ReplaceAll(str, "</pre>", " ")
	str = strings.ReplaceAll(str, "<blockquote>", "")
	str = strings.ReplaceAll(str, "</blockquote>", " ")

	// Remove newlines and extra spaces
	str = strings.ReplaceAll(str, "\n", " ")
	str = strings.Join(strings.Fields(str), " ")

	return template.HTML(strings.TrimSpace(str))
}
