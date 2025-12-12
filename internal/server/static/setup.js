/**
 * Setup Page - API Configuration
 * Handles the initial setup flow for configuring API credentials
 */

function togglePassword() {
    const apiKeyInput = document.getElementById('api-key');
    const showKeyCheckbox = document.getElementById('show-key');
    apiKeyInput.type = showKeyCheckbox.checked ? 'text' : 'password';
}

async function testConnection(apiUrl, apiKey) {
    try {
        const headers = {};
        // Only add API key header if provided (allows anonymous access)
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
        }

        const response = await fetch(`${apiUrl}/api/2025.12/status`, { headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Initialize setup form
document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill form if values exist in sessionStorage (for reconfiguration)
    const savedUrl = sessionStorage.getItem('manuals_api_url');
    const savedKey = sessionStorage.getItem('manuals_api_key');

    if (savedUrl) {
        document.getElementById('api-url').value = savedUrl;
    }
    if (savedKey) {
        document.getElementById('api-key').value = savedKey;
    }

    // Setup form submission
    document.getElementById('setup-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const apiUrl = document.getElementById('api-url').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const successDiv = document.getElementById('success-message');
        const submitButton = e.target.querySelector('button[type="submit"]');

        // Hide previous messages
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Testing Connection...';

        // Test connection
        const result = await testConnection(apiUrl, apiKey);

        if (result.success) {
            // Save to sessionStorage (more secure - cleared when tab closes)
            sessionStorage.setItem('manuals_api_url', apiUrl);
            sessionStorage.setItem('manuals_api_key', apiKey);
            sessionStorage.setItem('manuals_configured', 'true');

            // Handle Remember Me
            const rememberCheckbox = document.getElementById('remember-me');
            if (rememberCheckbox && typeof window.handleRememberMe === 'function') {
                window.handleRememberMe(apiUrl, apiKey, rememberCheckbox.checked);
            }

            // Show success message
            successDiv.classList.remove('hidden');

            // Show success notification
            if (typeof notifications !== 'undefined') {
                notifications.success('Configuration saved successfully!');
            }

            // Redirect to home after 1 second
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            // Show error message
            errorText.textContent = result.error;
            errorDiv.classList.remove('hidden');

            // Show error notification
            if (typeof notifications !== 'undefined') {
                notifications.error(`Connection failed: ${result.error}`);
            }

            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Test Connection & Save';
        }
    });

    // Guest mode button handler
    const guestBtn = document.getElementById('guest-btn');
    if (guestBtn) {
        guestBtn.addEventListener('click', async () => {
            const apiUrl = document.getElementById('api-url').value.trim();
            const errorDiv = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');
            const successDiv = document.getElementById('success-message');

            // Hide previous messages
            errorDiv.classList.add('hidden');
            successDiv.classList.add('hidden');

            if (!apiUrl) {
                errorText.textContent = 'Please enter the API URL first';
                errorDiv.classList.remove('hidden');
                return;
            }

            // Disable button while testing
            guestBtn.disabled = true;
            guestBtn.textContent = 'Testing Connection...';

            // Test connection without API key (anonymous)
            const result = await testConnection(apiUrl, '');

            if (result.success) {
                // Save URL only (no API key for guest mode)
                sessionStorage.setItem('manuals_api_url', apiUrl);
                sessionStorage.setItem('manuals_api_key', '');
                sessionStorage.setItem('manuals_anonymous_mode', 'true');
                sessionStorage.setItem('manuals_configured', 'true');

                // Show success message
                successDiv.classList.remove('hidden');

                // Show notification
                if (typeof notifications !== 'undefined') {
                    notifications.info('Browsing in guest mode. Admin features are unavailable.');
                }

                // Redirect to home after 1 second
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                // Show error message
                errorText.textContent = result.error;
                errorDiv.classList.remove('hidden');

                // Show error notification
                if (typeof notifications !== 'undefined') {
                    notifications.error(`Connection failed: ${result.error}`);
                }

                // Re-enable button
                guestBtn.disabled = false;
                guestBtn.textContent = 'Browse as Guest (read-only)';
            }
        });
    }
});
