/**
 * Dark Mode - Theme switcher with system preference support
 * Persists user preference in localStorage
 */

class DarkModeManager {
    constructor() {
        this.storageKey = 'manuals_theme';
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.init();
    }

    init() {
        // Apply theme immediately (before page render) to prevent flash
        this.applyTheme(this.currentTheme);

        // Create toggle button
        this.createToggleButton();

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }

        console.log(`[DarkMode] Initialized with theme: ${this.currentTheme}`);
    }

    /**
     * Get stored theme from localStorage
     */
    getStoredTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.error('[DarkMode] Error reading theme:', error);
            return null;
        }
    }

    /**
     * Save theme to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (error) {
            console.error('[DarkMode] Error saving theme:', error);
        }
    }

    /**
     * Get effective theme (resolving 'auto' to light/dark)
     */
    getEffectiveTheme(theme) {
        if (theme === 'auto') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
        return theme;
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const effectiveTheme = this.getEffectiveTheme(theme);
        const html = document.documentElement;

        if (effectiveTheme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        // Update toggle button if it exists
        this.updateToggleButton();
    }

    /**
     * Set theme and persist
     */
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.error(`[DarkMode] Invalid theme: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.saveTheme(theme);
        this.applyTheme(theme);

        console.log(`[DarkMode] Theme changed to: ${theme}`);

        if (typeof notifications !== 'undefined') {
            const themeName = theme === 'auto' ? 'Auto (System)' : theme.charAt(0).toUpperCase() + theme.slice(1);
            notifications.success(`Theme set to ${themeName}`);
        }
    }

    /**
     * Toggle between themes
     */
    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    }

    /**
     * Create theme toggle button in navigation
     */
    createToggleButton() {
        // Find navigation bar
        const nav = document.querySelector('nav.bg-indigo-600');
        if (!nav) return;

        // Create toggle button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex items-center ml-auto';
        buttonContainer.id = 'theme-toggle-container';

        // Create button
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'ml-4 p-2 text-indigo-200 hover:text-white hover:bg-indigo-500 rounded-md focus:outline-none focus:ring-2 focus:ring-white';
        button.setAttribute('aria-label', 'Toggle theme');
        button.title = 'Toggle theme';

        // Add SVG icons
        button.innerHTML = `
            <!-- Light mode icon -->
            <svg class="h-5 w-5 hidden light-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <!-- Dark mode icon -->
            <svg class="h-5 w-5 hidden dark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <!-- Auto mode icon -->
            <svg class="h-5 w-5 hidden auto-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        `;

        button.addEventListener('click', () => {
            this.toggleTheme();
        });

        buttonContainer.appendChild(button);

        // Insert before mobile menu button or at end of nav
        const navContainer = nav.querySelector('.mx-auto.max-w-7xl');
        const flexContainer = navContainer?.querySelector('.flex.h-16');
        const mobileMenuButton = document.getElementById('mobile-menu-button')?.parentElement;

        if (flexContainer) {
            if (mobileMenuButton) {
                // Insert before mobile menu button
                flexContainer.insertBefore(buttonContainer, mobileMenuButton);
            } else {
                // Insert at end
                flexContainer.appendChild(buttonContainer);
            }
        }

        this.updateToggleButton();
    }

    /**
     * Update toggle button icon based on current theme
     */
    updateToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        // Hide all icons
        button.querySelectorAll('svg').forEach(icon => {
            icon.classList.add('hidden');
        });

        // Show appropriate icon
        if (this.currentTheme === 'light') {
            button.querySelector('.light-icon')?.classList.remove('hidden');
        } else if (this.currentTheme === 'dark') {
            button.querySelector('.dark-icon')?.classList.remove('hidden');
        } else {
            button.querySelector('.auto-icon')?.classList.remove('hidden');
        }
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Get effective theme (resolving auto)
     */
    getEffectiveThemeName() {
        return this.getEffectiveTheme(this.currentTheme);
    }
}

// Apply theme immediately (before page fully loads) to prevent flash
(function() {
    try {
        const theme = localStorage.getItem('manuals_theme') || 'auto';
        const effectiveTheme = theme === 'auto'
            ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    } catch (error) {
        console.error('[DarkMode] Error applying initial theme:', error);
    }
})();

// Initialize after DOM loads
const darkMode = new DarkModeManager();

// Make it available globally
window.darkMode = darkMode;

console.log('[DarkMode] Dark mode manager initialized');
console.log('[DarkMode] Click sun/moon icon in navigation to toggle');
