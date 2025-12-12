/**
 * Keyboard Shortcuts Configuration - Customize key bindings
 * Allows users to customize shortcuts and save to localStorage
 */

class ShortcutConfigManager {
    constructor() {
        this.storageKey = 'manuals_custom_shortcuts';
        this.recordingShortcut = null;
        this.customBindings = this.loadCustomBindings();
        this.init();
    }

    init() {
        // Wait for keyboard shortcuts to be initialized
        if (typeof window.keyboardShortcuts === 'undefined') {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Apply custom bindings
        this.applyCustomBindings();

        // Add customize button to help modal
        this.addCustomizeButton();

        console.log('[ShortcutConfig] Shortcut customization initialized');
    }

    /**
     * Load custom bindings from localStorage
     */
    loadCustomBindings() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('[ShortcutConfig] Error loading custom bindings:', error);
            return {};
        }
    }

    /**
     * Save custom bindings to localStorage
     */
    saveCustomBindings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customBindings));
            console.log('[ShortcutConfig] Custom bindings saved');
        } catch (error) {
            console.error('[ShortcutConfig] Error saving custom bindings:', error);
        }
    }

    /**
     * Apply custom bindings to shortcuts manager
     */
    applyCustomBindings() {
        for (const [originalKey, customKey] of Object.entries(this.customBindings)) {
            const shortcut = window.keyboardShortcuts.shortcuts.get(originalKey);
            if (shortcut && customKey !== originalKey) {
                // Remove original binding
                window.keyboardShortcuts.shortcuts.delete(originalKey);
                // Add new binding
                window.keyboardShortcuts.shortcuts.set(customKey, shortcut);
            }
        }
    }

    /**
     * Add "Customize" button to help modal
     */
    addCustomizeButton() {
        const helpModal = document.getElementById('shortcuts-help-modal');
        if (!helpModal) return;

        const footer = helpModal.querySelector('.bg-gray-50.border-t');
        if (!footer) return;

        const customizeBtn = document.createElement('button');
        customizeBtn.className = 'text-sm text-indigo-600 hover:text-indigo-500 font-medium';
        customizeBtn.textContent = 'Customize Shortcuts';
        customizeBtn.onclick = () => {
            window.keyboardShortcuts.toggleHelp();
            this.showConfigModal();
        };

        footer.insertBefore(customizeBtn, footer.firstChild);
    }

    /**
     * Show customization modal
     */
    showConfigModal() {
        // Check if modal already exists
        let modal = document.getElementById('shortcut-config-modal');
        if (!modal) {
            modal = this.createConfigModal();
            document.body.appendChild(modal);
        }

        this.updateConfigModal();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    /**
     * Hide customization modal
     */
    hideConfigModal() {
        const modal = document.getElementById('shortcut-config-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.recordingShortcut = null;
    }

    /**
     * Create customization modal
     */
    createConfigModal() {
        const modal = document.createElement('div');
        modal.id = 'shortcut-config-modal';
        modal.className = 'fixed inset-0 bg-gray-500 bg-opacity-75 z-50 hidden flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Customize Keyboard Shortcuts</h2>
                        <button onclick="window.shortcutConfig.hideConfigModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="px-6 py-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Click on a shortcut to record a new key binding. Press Esc to cancel recording.
                    </p>
                    <div id="shortcuts-config-list" class="space-y-2">
                        <!-- Shortcuts will be populated here -->
                    </div>
                </div>
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <button
                        onclick="window.shortcutConfig.resetToDefaults()"
                        class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onclick="window.shortcutConfig.hideConfigModal()"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
                    >
                        Done
                    </button>
                </div>
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideConfigModal();
            }
        });

        // Listen for key presses when recording
        document.addEventListener('keydown', (e) => {
            if (this.recordingShortcut) {
                e.preventDefault();
                this.recordKey(e);
            }
        });

        return modal;
    }

    /**
     * Update config modal with current shortcuts
     */
    updateConfigModal() {
        const container = document.getElementById('shortcuts-config-list');
        if (!container) return;

        const shortcuts = window.keyboardShortcuts.shortcuts;
        let html = '';

        for (const [key, shortcut] of shortcuts.entries()) {
            const originalKey = this.getOriginalKey(key);
            const isCustom = this.customBindings[originalKey] !== undefined;
            const displayKey = isCustom ? this.customBindings[originalKey] : key;

            html += `
                <div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span class="text-sm text-gray-700 dark:text-gray-300">${this.escapeHtml(shortcut.description)}</span>
                    <div class="flex items-center gap-2">
                        ${isCustom ? `<span class="text-xs text-indigo-600 dark:text-indigo-400">Custom</span>` : ''}
                        <button
                            onclick="window.shortcutConfig.startRecording('${this.escapeHtml(originalKey)}')"
                            class="px-3 py-1 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
                        >
                            ${this.formatKey(displayKey)}
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Get original key before customization
     */
    getOriginalKey(currentKey) {
        // Check if this is a customized key
        for (const [original, custom] of Object.entries(this.customBindings)) {
            if (custom === currentKey) {
                return original;
            }
        }
        return currentKey;
    }

    /**
     * Start recording a new key binding
     */
    startRecording(originalKey) {
        this.recordingShortcut = originalKey;

        // Update UI to show recording state
        const container = document.getElementById('shortcuts-config-list');
        if (container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(btn => {
                if (btn.textContent.includes(this.formatKey(originalKey)) ||
                    btn.textContent.includes(this.formatKey(this.customBindings[originalKey] || ''))) {
                    btn.textContent = 'Press any key...';
                    btn.classList.add('animate-pulse', 'bg-indigo-100', 'dark:bg-indigo-900');
                }
            });
        }

        if (typeof notifications !== 'undefined') {
            notifications.info(`Recording shortcut for: ${originalKey}. Press Esc to cancel.`, 3000);
        }
    }

    /**
     * Record a key press
     */
    recordKey(event) {
        const originalKey = this.recordingShortcut;

        // Cancel recording on Escape
        if (event.key === 'Escape') {
            this.recordingShortcut = null;
            this.updateConfigModal();
            return;
        }

        // Build new key combination
        let newKey = event.key;

        // For two-key sequences, we need to handle differently
        // For now, only support single keys
        if (newKey.length === 1) {
            newKey = newKey.toLowerCase();
        }

        // Check if key is already in use
        const existingShortcut = window.keyboardShortcuts.shortcuts.get(newKey);
        if (existingShortcut && this.getOriginalKey(newKey) !== originalKey) {
            if (typeof notifications !== 'undefined') {
                notifications.error(`Key "${newKey}" is already assigned to: ${existingShortcut.description}`);
            }
            this.recordingShortcut = null;
            this.updateConfigModal();
            return;
        }

        // Save custom binding
        this.customBindings[originalKey] = newKey;
        this.saveCustomBindings();

        // Reload shortcuts
        window.location.reload();
    }

    /**
     * Reset to default key bindings
     */
    resetToDefaults() {
        if (confirm('Are you sure you want to reset all shortcuts to defaults?')) {
            this.customBindings = {};
            this.saveCustomBindings();

            if (typeof notifications !== 'undefined') {
                notifications.success('Shortcuts reset to defaults. Reloading...');
            }

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    /**
     * Format key for display
     */
    formatKey(key) {
        if (!key) return '';

        // Handle special keys
        const specialKeys = {
            ' ': 'Space',
            'Escape': 'Esc',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };

        return key.split(' ').map(k => specialKeys[k] || k).join(' then ');
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize shortcut config manager
const shortcutConfig = new ShortcutConfigManager();

// Make it available globally
window.shortcutConfig = shortcutConfig;

console.log('[ShortcutConfig] Shortcut customization ready');
console.log('[ShortcutConfig] Press ? then click "Customize Shortcuts" to configure');
