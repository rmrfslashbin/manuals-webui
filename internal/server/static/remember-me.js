/**
 * Remember Me - Persistent API credentials (obfuscated in localStorage)
 *
 * SECURITY WARNING:
 * This stores API credentials in localStorage with basic obfuscation (NOT encryption).
 * Credentials are accessible via browser DevTools and browser extensions.
 * Only use on trusted devices in secure environments.
 */

class RememberMeManager {
    constructor() {
        this.storageKey = 'manuals_remember_me';
        this.credentialsKey = 'manuals_saved_creds';
        this.init();
    }

    init() {
        // Auto-load credentials on setup page if enabled
        if (window.location.pathname === '/setup') {
            this.autoLoadCredentials();
        }

        console.log('[RememberMe] Remember Me manager initialized');
    }

    /**
     * Check if Remember Me is enabled
     */
    isEnabled() {
        try {
            return localStorage.getItem(this.storageKey) === 'true';
        } catch (error) {
            console.error('[RememberMe] Error checking status:', error);
            return false;
        }
    }

    /**
     * Enable Remember Me and save current credentials
     */
    enable(apiUrl, apiKey) {
        try {
            // Obfuscate (not encrypt) credentials
            const encoded = this.obfuscate(JSON.stringify({
                url: apiUrl,
                key: apiKey,
                savedAt: Date.now()
            }));

            localStorage.setItem(this.credentialsKey, encoded);
            localStorage.setItem(this.storageKey, 'true');

            console.log('[RememberMe] Enabled');

            if (typeof notifications !== 'undefined') {
                notifications.warning('API credentials saved to localStorage (obfuscated, not encrypted). Only use on trusted devices.', 8000);
            }

            return true;
        } catch (error) {
            console.error('[RememberMe] Error enabling:', error);
            if (typeof notifications !== 'undefined') {
                notifications.error('Failed to save credentials: ' + error.message);
            }
            return false;
        }
    }

    /**
     * Disable Remember Me and clear saved credentials
     */
    disable() {
        try {
            localStorage.removeItem(this.credentialsKey);
            localStorage.removeItem(this.storageKey);

            console.log('[RememberMe] Disabled');

            if (typeof notifications !== 'undefined') {
                notifications.success('Saved credentials cleared');
            }

            return true;
        } catch (error) {
            console.error('[RememberMe] Error disabling:', error);
            return false;
        }
    }

    /**
     * Get saved credentials
     */
    getCredentials() {
        try {
            if (!this.isEnabled()) {
                return null;
            }

            const encoded = localStorage.getItem(this.credentialsKey);
            if (!encoded) {
                return null;
            }

            const decoded = this.deobfuscate(encoded);
            const creds = JSON.parse(decoded);

            // Check if credentials are too old (30 days)
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            if (Date.now() - creds.savedAt > maxAge) {
                console.log('[RememberMe] Credentials expired, clearing');
                this.disable();
                return null;
            }

            return {
                url: creds.url,
                key: creds.key
            };
        } catch (error) {
            console.error('[RememberMe] Error getting credentials:', error);
            // Clear corrupted data
            this.disable();
            return null;
        }
    }

    /**
     * Auto-load credentials on setup page
     */
    autoLoadCredentials() {
        const creds = this.getCredentials();
        if (!creds) return;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.fillSetupForm(creds);
            });
        } else {
            this.fillSetupForm(creds);
        }
    }

    /**
     * Fill setup form with saved credentials
     */
    fillSetupForm(creds) {
        const urlInput = document.getElementById('api-url');
        const keyInput = document.getElementById('api-key');
        const rememberCheckbox = document.getElementById('remember-me');

        if (urlInput && keyInput) {
            urlInput.value = creds.url;
            keyInput.value = creds.key;

            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }

            console.log('[RememberMe] Auto-filled credentials');

            if (typeof notifications !== 'undefined') {
                notifications.info('Loaded saved credentials. Click "Test Connection & Save" to continue.');
            }
        }
    }

    /**
     * Basic obfuscation (NOT encryption)
     * Just makes credentials not immediately readable
     */
    obfuscate(text) {
        try {
            // Base64 encode
            return btoa(encodeURIComponent(text));
        } catch (error) {
            console.error('[RememberMe] Obfuscation error:', error);
            return text;
        }
    }

    /**
     * Reverse obfuscation
     */
    deobfuscate(encoded) {
        try {
            return decodeURIComponent(atob(encoded));
        } catch (error) {
            console.error('[RememberMe] Deobfuscation error:', error);
            throw new Error('Invalid saved credentials');
        }
    }

    /**
     * Show security warning
     */
    showSecurityWarning() {
        if (typeof notifications !== 'undefined') {
            notifications.warning(
                'Remember Me stores credentials in browser localStorage (obfuscated, not encrypted). ' +
                'Credentials are accessible via DevTools. Only use on trusted devices.',
                10000
            );
        }
    }
}

// Initialize Remember Me manager
const rememberMe = new RememberMeManager();

// Make it available globally
window.rememberMe = rememberMe;

// Helper function for setup page
window.handleRememberMe = function(apiUrl, apiKey, remember) {
    if (remember) {
        rememberMe.enable(apiUrl, apiKey);
    } else {
        rememberMe.disable();
    }
};

console.log('[RememberMe] Use window.rememberMe to manage saved credentials');
