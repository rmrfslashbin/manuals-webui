/**
 * Request Retry Logic - Automatic retry for failed HTMX requests
 * Implements exponential backoff with configurable retry limits
 */

class RequestRetryManager {
    constructor(maxRetries = 3, baseDelay = 1000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.retryMap = new Map(); // Track retry counts per request
        this.init();
    }

    init() {
        // Intercept HTMX request errors
        document.addEventListener('htmx:responseError', (event) => {
            this.handleRetry(event);
        });

        document.addEventListener('htmx:sendError', (event) => {
            this.handleRetry(event);
        });

        // Clean up retry tracking after successful requests
        document.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail.successful) {
                this.clearRetry(event.detail.elt);
            }
        });
    }

    /**
     * Determine if a request should be retried based on error type
     */
    shouldRetry(event) {
        const detail = event.detail;

        // Network errors (no response) - always retry
        if (!detail.xhr || detail.xhr.status === 0) {
            return true;
        }

        // HTTP status codes that warrant retry
        const retryableStatuses = [
            408, // Request Timeout
            429, // Too Many Requests
            500, // Internal Server Error
            502, // Bad Gateway
            503, // Service Unavailable
            504, // Gateway Timeout
        ];

        return retryableStatuses.includes(detail.xhr.status);
    }

    /**
     * Get unique identifier for a request element
     */
    getRequestId(element) {
        // Use element's unique path or create one
        if (!element.dataset.retryId) {
            element.dataset.retryId = `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return element.dataset.retryId;
    }

    /**
     * Get current retry count for an element
     */
    getRetryCount(element) {
        const id = this.getRequestId(element);
        return this.retryMap.get(id) || 0;
    }

    /**
     * Increment retry count for an element
     */
    incrementRetry(element) {
        const id = this.getRequestId(element);
        const count = this.getRetryCount(element) + 1;
        this.retryMap.set(id, count);
        return count;
    }

    /**
     * Clear retry tracking for an element
     */
    clearRetry(element) {
        const id = this.getRequestId(element);
        this.retryMap.delete(id);
        delete element.dataset.retryId;
    }

    /**
     * Calculate exponential backoff delay
     */
    getBackoffDelay(retryCount) {
        // Exponential backoff: baseDelay * 2^(retryCount - 1)
        // With jitter to prevent thundering herd
        const exponentialDelay = this.baseDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 1000; // Random 0-1000ms jitter
        return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
    }

    /**
     * Main retry handler
     */
    handleRetry(event) {
        const element = event.detail.elt;

        // Check if this error type should be retried
        if (!this.shouldRetry(event)) {
            return;
        }

        // Check if we've exceeded max retries
        const currentRetries = this.getRetryCount(element);
        if (currentRetries >= this.maxRetries) {
            if (typeof notifications !== 'undefined') {
                notifications.error(`Request failed after ${this.maxRetries} attempts`);
            }
            this.clearRetry(element);
            return;
        }

        // Increment retry count
        const retryCount = this.incrementRetry(element);
        const delay = this.getBackoffDelay(retryCount);

        // Notify user of retry attempt
        if (typeof notifications !== 'undefined') {
            const statusCode = event.detail.xhr ? event.detail.xhr.status : 'network error';
            notifications.warning(
                `Request failed (${statusCode}). Retrying in ${Math.round(delay / 1000)}s... (attempt ${retryCount}/${this.maxRetries})`,
                delay
            );
        }

        // Schedule retry with exponential backoff
        setTimeout(() => {
            console.log(`[Retry] Attempting retry ${retryCount}/${this.maxRetries} after ${delay}ms`);

            // Trigger the original request again
            // HTMX stores the original request config on the element
            if (window.htmx && element) {
                try {
                    window.htmx.trigger(element, 'htmx:retry');
                    // Re-issue the original HTMX request
                    const method = element.getAttribute('hx-get') ? 'get' :
                                 element.getAttribute('hx-post') ? 'post' :
                                 element.getAttribute('hx-put') ? 'put' :
                                 element.getAttribute('hx-delete') ? 'delete' : null;

                    if (method) {
                        const url = element.getAttribute(`hx-${method}`);
                        const target = element.getAttribute('hx-target');
                        const swap = element.getAttribute('hx-swap');

                        // Use HTMX's ajax function to retry
                        window.htmx.ajax(method.toUpperCase(), url, {
                            target: target || element,
                            swap: swap || 'innerHTML',
                            source: element
                        });
                    }
                } catch (error) {
                    console.error('[Retry] Failed to retry request:', error);
                    if (typeof notifications !== 'undefined') {
                        notifications.error('Retry failed: ' + error.message);
                    }
                }
            }
        }, delay);
    }
}

// Initialize retry manager with default settings
// maxRetries: 3, baseDelay: 1000ms
const retryManager = new RequestRetryManager(3, 1000);

// Make it available globally for customization if needed
window.retryManager = retryManager;
