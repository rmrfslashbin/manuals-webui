/**
 * Search History - Remember and display recent searches
 * Stores search history in localStorage with timestamp
 */

class SearchHistoryManager {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'manuals_search_history';
        this.maxItems = options.maxItems || 10;
        this.init();
    }

    init() {
        // Only initialize on search page
        if (window.location.pathname === '/search') {
            this.setupSearchTracking();
            this.displayHistory();
        }
    }

    /**
     * Get search history from localStorage
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[SearchHistory] Error reading history:', error);
            return [];
        }
    }

    /**
     * Save search history to localStorage
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('[SearchHistory] Error saving history:', error);
        }
    }

    /**
     * Add search query to history
     */
    addSearch(query) {
        if (!query || query.trim() === '') return;

        const history = this.getHistory();
        const trimmedQuery = query.trim();

        // Remove duplicate if exists
        const filtered = history.filter(item => item.query !== trimmedQuery);

        // Add new search at beginning
        filtered.unshift({
            query: trimmedQuery,
            timestamp: Date.now()
        });

        // Limit to maxItems
        const limited = filtered.slice(0, this.maxItems);

        this.saveHistory(limited);
        this.displayHistory();

        console.log(`[SearchHistory] Added: "${trimmedQuery}"`);
    }

    /**
     * Clear all search history
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            this.displayHistory();
            console.log('[SearchHistory] Cleared');

            if (typeof notifications !== 'undefined') {
                notifications.success('Search history cleared');
            }
        } catch (error) {
            console.error('[SearchHistory] Error clearing history:', error);
        }
    }

    /**
     * Remove specific search from history
     */
    removeSearch(query) {
        const history = this.getHistory();
        const filtered = history.filter(item => item.query !== query);
        this.saveHistory(filtered);
        this.displayHistory();
    }

    /**
     * Setup search form tracking
     */
    setupSearchTracking() {
        // Find search form
        const searchForm = document.querySelector('form[action="/search"], form#search-form');
        if (!searchForm) return;

        searchForm.addEventListener('submit', (e) => {
            const queryInput = searchForm.querySelector('input[name="q"], input[name="query"], input[type="search"]');
            if (queryInput) {
                this.addSearch(queryInput.value);
            }
        });
    }

    /**
     * Display search history on page
     */
    displayHistory() {
        const container = document.getElementById('search-history');
        if (!container) return;

        const history = this.getHistory();

        if (history.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="mt-2 text-sm">No recent searches</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-900">Recent Searches</h3>
                <button
                    onclick="window.searchHistory.clearHistory()"
                    class="text-xs text-gray-500 hover:text-gray-700"
                >
                    Clear all
                </button>
            </div>
            <div class="space-y-2">
        `;

        for (const item of history) {
            const timeAgo = this.formatTimeAgo(item.timestamp);
            const encodedQuery = encodeURIComponent(item.query);

            html += `
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
                    <a
                        href="/search?q=${encodedQuery}"
                        class="flex-1 flex items-center space-x-2 text-sm text-gray-700 hover:text-indigo-600"
                    >
                        <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span class="flex-1">${this.escapeHtml(item.query)}</span>
                        <span class="text-xs text-gray-400">${timeAgo}</span>
                    </a>
                    <button
                        onclick="window.searchHistory.removeSearch('${this.escapeHtml(item.query).replace(/'/g, "\\'")}')"
                        class="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                        title="Remove from history"
                    >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            `;
        }

        html += `
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Format timestamp as relative time
     */
    formatTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get search suggestions based on history
     */
    getSuggestions(query) {
        if (!query || query.trim() === '') return [];

        const history = this.getHistory();
        const lowerQuery = query.toLowerCase();

        return history
            .filter(item => item.query.toLowerCase().includes(lowerQuery))
            .map(item => item.query)
            .slice(0, 5);
    }
}

// Initialize search history manager
const searchHistory = new SearchHistoryManager({
    maxItems: 10
});

// Make it available globally
window.searchHistory = searchHistory;

console.log('[SearchHistory] Search history manager initialized');
