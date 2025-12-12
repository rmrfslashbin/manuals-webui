/**
 * Keyboard Shortcuts - Global keyboard navigation
 * Provides Gmail-style keyboard shortcuts for navigation
 */

class KeyboardShortcutManager {
    constructor() {
        this.shortcuts = new Map();
        this.sequenceBuffer = [];
        this.sequenceTimeout = null;
        this.helpModalVisible = false;
        this.init();
    }

    init() {
        // Register default shortcuts
        this.registerShortcuts();

        // Listen for keyboard events
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Create help modal
        this.createHelpModal();
    }

    registerShortcuts() {
        // Single-key shortcuts
        this.register('/', (e) => {
            const searchInput = document.querySelector('#search-input, input[name="query"], input[type="search"]');
            if (searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }, 'Focus search box');

        this.register('?', () => {
            this.toggleHelp();
        }, 'Show keyboard shortcuts');

        this.register('Escape', () => {
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                document.getElementById('mobile-menu-button')?.setAttribute('aria-expanded', 'false');
                return;
            }

            // Close help modal if open
            if (this.helpModalVisible) {
                this.toggleHelp();
                return;
            }

            // Blur current element
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }, 'Close modals / Blur focus');

        // Two-key sequence shortcuts (Gmail-style)
        this.register('g h', () => {
            window.location.href = '/';
        }, 'Go to Home');

        this.register('g d', () => {
            window.location.href = '/devices';
        }, 'Go to Devices');

        this.register('g s', () => {
            window.location.href = '/search';
        }, 'Go to Search');

        this.register('g a', () => {
            window.location.href = '/admin';
        }, 'Go to Admin');

        this.register('g t', () => {
            window.location.href = '/settings';
        }, 'Go to Settings (configuraTion)');

        // Cache controls (for debugging)
        this.register('c c', () => {
            if (window.cacheControl) {
                window.cacheControl.clear();
                if (typeof notifications !== 'undefined') {
                    notifications.info('Cache cleared');
                }
            }
        }, 'Clear cache (debug)');

        this.register('c s', () => {
            if (window.cacheControl) {
                window.cacheControl.stats();
                if (typeof notifications !== 'undefined') {
                    notifications.info('Cache stats in console');
                }
            }
        }, 'Show cache stats (debug)');
    }

    register(keys, action, description) {
        this.shortcuts.set(keys, { action, description });
    }

    handleKeydown(e) {
        // Ignore shortcuts when typing in input fields
        const tagName = e.target.tagName.toLowerCase();
        const isEditable = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || e.target.isContentEditable;

        // Allow Escape and ? even in input fields
        if (isEditable && e.key !== 'Escape' && e.key !== '?') {
            return;
        }

        // For single-character shortcuts
        const singleKey = e.key;
        if (this.shortcuts.has(singleKey) && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            this.shortcuts.get(singleKey).action(e);
            return;
        }

        // For two-key sequences (like "g h")
        this.sequenceBuffer.push(e.key.toLowerCase());

        // Clear old timeout
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }

        // Set new timeout to clear buffer after 1 second
        this.sequenceTimeout = setTimeout(() => {
            this.sequenceBuffer = [];
        }, 1000);

        // Check if we have a two-key sequence
        if (this.sequenceBuffer.length === 2) {
            const sequence = this.sequenceBuffer.join(' ');
            if (this.shortcuts.has(sequence)) {
                e.preventDefault();
                this.shortcuts.get(sequence).action(e);
            }
            this.sequenceBuffer = [];
        }

        // Limit buffer size
        if (this.sequenceBuffer.length > 2) {
            this.sequenceBuffer = [this.sequenceBuffer[this.sequenceBuffer.length - 1]];
        }
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'shortcuts-help-modal';
        modal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 hidden flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                        <button onclick="window.keyboardShortcuts.toggleHelp()" class="text-gray-400 hover:text-gray-600">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="px-6 py-4">
                    <div id="shortcuts-list" class="space-y-4">
                        <!-- Shortcuts will be populated here -->
                    </div>
                </div>
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p class="text-sm text-gray-500">
                        Press <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Esc</kbd> to close
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.toggleHelp();
            }
        });

        // Populate shortcuts list
        this.updateHelpModal();
    }

    updateHelpModal() {
        const listContainer = document.getElementById('shortcuts-list');
        if (!listContainer) return;

        // Group shortcuts by category
        const groups = {
            'Navigation': ['g h', 'g d', 'g s', 'g a', 'g t'],
            'Search': ['/'],
            'General': ['?', 'Escape'],
            'Debug': ['c c', 'c s']
        };

        let html = '';
        for (const [category, keys] of Object.entries(groups)) {
            html += `
                <div>
                    <h3 class="text-sm font-semibold text-gray-700 mb-2">${category}</h3>
                    <div class="space-y-2">
            `;

            for (const key of keys) {
                const shortcut = this.shortcuts.get(key);
                if (shortcut) {
                    const keyDisplay = key.split(' ').map(k =>
                        `<kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">${k}</kbd>`
                    ).join(' then ');

                    html += `
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">${shortcut.description}</span>
                            <span class="text-sm">${keyDisplay}</span>
                        </div>
                    `;
                }
            }

            html += `
                    </div>
                </div>
            `;
        }

        listContainer.innerHTML = html;
    }

    toggleHelp() {
        const modal = document.getElementById('shortcuts-help-modal');
        if (!modal) return;

        this.helpModalVisible = !this.helpModalVisible;
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeydown);
        const modal = document.getElementById('shortcuts-help-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Initialize keyboard shortcuts
const keyboardShortcuts = new KeyboardShortcutManager();

// Make it available globally
window.keyboardShortcuts = keyboardShortcuts;

console.log('[Shortcuts] Keyboard shortcuts enabled');
console.log('[Shortcuts] Press ? to view all shortcuts');
