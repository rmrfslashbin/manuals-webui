/**
 * Toast Notification System
 * Simple, lightweight notifications for errors, success, and info messages
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification
     * @param {string} message - The message to display
     * @param {string} type - Type: 'error', 'success', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     */
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `
            transform translate-x-full opacity-0
            transition-all duration-300 ease-in-out
            max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
            ring-1 ring-black ring-opacity-5 overflow-hidden
        `.trim().replace(/\s+/g, ' ');

        const config = this.getTypeConfig(type);

        notification.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        ${config.icon}
                    </div>
                    <div class="ml-3 w-0 flex-1 pt-0.5">
                        <p class="text-sm font-medium text-gray-900">
                            ${this.escapeHtml(message)}
                        </p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button
                            onclick="notifications.dismiss(this.closest('.transform'))"
                            class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span class="sr-only">Close</span>
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div class="h-1 ${config.progressColor}">
                <div class="h-full bg-opacity-50 animate-shrink"></div>
            </div>
        `;

        return notification;
    }

    getTypeConfig(type) {
        const configs = {
            error: {
                icon: `<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                progressColor: 'bg-red-200'
            },
            success: {
                icon: `<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                progressColor: 'bg-green-200'
            },
            warning: {
                icon: `<svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>`,
                progressColor: 'bg-yellow-200'
            },
            info: {
                icon: `<svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                progressColor: 'bg-blue-200'
            }
        };

        return configs[type] || configs.info;
    }

    dismiss(notification) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    // Convenience methods
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
const notifications = new NotificationManager();

// HTMX error handler
document.addEventListener('htmx:responseError', (event) => {
    const status = event.detail.xhr.status;
    let message = 'Request failed';

    if (status === 0) {
        message = 'Cannot connect to server. Please check your connection.';
    } else if (status === 401 || status === 403) {
        message = 'Authentication failed. Please check your API key.';
    } else if (status === 404) {
        message = 'Resource not found.';
    } else if (status >= 500) {
        message = 'Server error. Please try again later.';
    } else {
        message = `Request failed with status ${status}`;
    }

    notifications.error(message);
});

// Handle network errors
document.addEventListener('htmx:sendError', () => {
    notifications.error('Network error. Please check your connection.');
});

// Handle API configuration errors
window.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page that requires API configuration
    const currentPath = window.location.pathname;
    const publicPages = ['/setup', '/settings'];

    if (!publicPages.includes(currentPath)) {
        const configured = sessionStorage.getItem('manuals_configured');
        if (!configured) {
            notifications.warning('API not configured. Redirecting to setup...', 2000);
        }
    }
});
