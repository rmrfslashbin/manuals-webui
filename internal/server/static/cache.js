/**
 * Client-Side Cache - In-memory caching for API responses
 * Reduces repeated API calls with configurable TTL
 */

class CacheManager {
    constructor(config = {}) {
        this.cache = new Map();
        this.defaultTTL = config.defaultTTL || 5 * 60 * 1000; // 5 minutes
        this.maxSize = config.maxSize || 100; // Max entries
        this.enabled = config.enabled !== false; // Enabled by default
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };

        // Start cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Every minute

        this.init();
    }

    init() {
        // Intercept HTMX requests for caching
        document.addEventListener('htmx:configRequest', (event) => {
            if (!this.enabled) return;

            // Only cache GET requests
            if (event.detail.verb !== 'get') return;

            const cacheKey = this.getCacheKey(event.detail);
            const cached = this.get(cacheKey);

            if (cached) {
                // Cache hit - cancel request and use cached response
                event.preventDefault();
                this.stats.hits++;

                // Manually update the target with cached content
                const target = event.detail.target;
                if (target && cached.data) {
                    target.innerHTML = cached.data;

                    // Trigger HTMX after events
                    document.dispatchEvent(new CustomEvent('htmx:afterRequest', {
                        detail: {
                            elt: event.detail.elt,
                            target: target,
                            successful: true,
                            fromCache: true
                        }
                    }));
                }

                console.log(`[Cache] HIT: ${cacheKey}`);
            } else {
                this.stats.misses++;
                console.log(`[Cache] MISS: ${cacheKey}`);
            }
        });

        // Cache successful responses
        document.addEventListener('htmx:afterRequest', (event) => {
            if (!this.enabled) return;
            if (event.detail.fromCache) return; // Don't re-cache cached responses

            // Only cache successful GET requests
            if (!event.detail.successful) return;

            const xhr = event.detail.xhr;
            if (!xhr || xhr.status !== 200) return;

            const method = event.detail.verb || 'get';
            if (method.toLowerCase() !== 'get') return;

            // Get response text
            const responseData = xhr.responseText;
            if (!responseData) return;

            const cacheKey = this.getCacheKeyFromResponse(event.detail);
            const ttl = this.getTTLFromHeaders(xhr);

            this.set(cacheKey, responseData, ttl);
            console.log(`[Cache] SET: ${cacheKey} (TTL: ${ttl}ms)`);
        });

        // Invalidate cache on mutations
        document.addEventListener('htmx:afterRequest', (event) => {
            const method = event.detail.verb || 'get';

            // POST, PUT, DELETE should invalidate related cache
            if (['post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                if (event.detail.successful) {
                    const url = event.detail.pathInfo?.requestPath;
                    if (url) {
                        this.invalidatePattern(url);
                        console.log(`[Cache] INVALIDATED: ${url}`);
                    }
                }
            }
        });
    }

    /**
     * Generate cache key from request details
     */
    getCacheKey(requestDetail) {
        const url = requestDetail.path || requestDetail.url;
        const headers = requestDetail.headers || {};

        // Include relevant headers in cache key
        const relevantHeaders = {
            'X-API-Key': headers['X-API-Key'] || ''
        };

        return `${url}:${JSON.stringify(relevantHeaders)}`;
    }

    /**
     * Generate cache key from response details
     */
    getCacheKeyFromResponse(responseDetail) {
        const url = responseDetail.pathInfo?.requestPath || responseDetail.url;
        const xhr = responseDetail.xhr;

        // Try to extract headers from request
        const headers = {};
        if (xhr) {
            // Note: Can't access request headers from XHR, use sessionStorage
            headers['X-API-Key'] = sessionStorage.getItem('manuals_api_key') || '';
        }

        return `${url}:${JSON.stringify(headers)}`;
    }

    /**
     * Get TTL from response headers (Cache-Control, Expires)
     */
    getTTLFromHeaders(xhr) {
        try {
            const cacheControl = xhr.getResponseHeader('Cache-Control');
            if (cacheControl) {
                const maxAge = cacheControl.match(/max-age=(\d+)/);
                if (maxAge) {
                    return parseInt(maxAge[1]) * 1000; // Convert to ms
                }
            }

            const expires = xhr.getResponseHeader('Expires');
            if (expires) {
                const expireTime = new Date(expires).getTime();
                const now = Date.now();
                if (expireTime > now) {
                    return expireTime - now;
                }
            }
        } catch (error) {
            console.warn('[Cache] Error parsing cache headers:', error);
        }

        return this.defaultTTL;
    }

    /**
     * Get cached entry
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry;
    }

    /**
     * Set cache entry
     */
    set(key, data, ttl = null) {
        // Enforce max size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const expiresAt = Date.now() + (ttl || this.defaultTTL);

        this.cache.set(key, {
            data,
            expiresAt,
            createdAt: Date.now()
        });

        this.stats.sets++;
    }

    /**
     * Delete specific cache entry
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        console.log('[Cache] Cleared all entries');
    }

    /**
     * Invalidate cache entries matching a URL pattern
     */
    invalidatePattern(pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                count++;
            }
        }
        console.log(`[Cache] Invalidated ${count} entries matching: ${pattern}`);
    }

    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        let count = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                count++;
            }
        }

        if (count > 0) {
            console.log(`[Cache] Cleaned up ${count} expired entries`);
        }
    }

    /**
     * Evict oldest entry (LRU-like)
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            console.log(`[Cache] Evicted oldest entry: ${oldestKey}`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Enable caching
     */
    enable() {
        this.enabled = true;
        console.log('[Cache] Enabled');
    }

    /**
     * Disable caching
     */
    disable() {
        this.enabled = false;
        console.log('[Cache] Disabled');
    }

    /**
     * Destroy cache manager
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}

// Initialize cache manager with sensible defaults
const cacheManager = new CacheManager({
    defaultTTL: 5 * 60 * 1000,  // 5 minutes
    maxSize: 100,                // 100 entries
    enabled: true
});

// Make it available globally
window.cacheManager = cacheManager;

// Add cache control to window for debugging
window.cacheControl = {
    stats: () => {
        const stats = cacheManager.getStats();
        console.table(stats);
        return stats;
    },
    clear: () => {
        cacheManager.clear();
    },
    enable: () => {
        cacheManager.enable();
    },
    disable: () => {
        cacheManager.disable();
    },
    invalidate: (pattern) => {
        cacheManager.invalidatePattern(pattern);
    }
};

console.log('[Cache] Cache manager initialized');
console.log('[Cache] Use window.cacheControl for debugging');
