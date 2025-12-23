import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

/**
 * Markdown rendering composable
 */
export function useMarkdown() {
  /**
   * Render markdown to HTML
   * @param {string} markdown - Markdown content
   * @returns {string} HTML content
   */
  function renderMarkdown(markdown) {
    if (!markdown) return ''
    return marked.parse(markdown)
  }

  /**
   * Render inline markdown (no block elements)
   * @param {string} markdown - Markdown content
   * @returns {string} HTML content
   */
  function renderInline(markdown) {
    if (!markdown) return ''
    return marked.parseInline(markdown)
  }

  /**
   * Strip markdown and return plain text
   * @param {string} markdown - Markdown content
   * @returns {string} Plain text
   */
  function stripMarkdown(markdown) {
    if (!markdown) return ''
    // Simple strip - remove common markdown syntax
    return markdown
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
  }

  return {
    renderMarkdown,
    renderInline,
    stripMarkdown
  }
}
