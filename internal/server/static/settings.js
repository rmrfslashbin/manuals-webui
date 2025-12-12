/**
 * Settings Page - Configuration Management
 * Handles viewing, testing, and clearing API configuration
 */

// Load current configuration on page load
window.addEventListener('DOMContentLoaded', () => {
    const apiUrl = sessionStorage.getItem('manuals_api_url') || 'Not configured';
    const apiKey = sessionStorage.getItem('manuals_api_key') || 'Not configured';

    document.getElementById('current-api-url').value = apiUrl;
    document.getElementById('current-api-key').value = apiKey ? '••••••••••••••••' : 'Not configured';
});

function clearConfiguration() {
    if (confirm('Are you sure you want to clear your API configuration? You will need to reconfigure before using the application.')) {
        sessionStorage.removeItem('manuals_api_url');
        sessionStorage.removeItem('manuals_api_key');
        sessionStorage.removeItem('manuals_configured');

        if (typeof notifications !== 'undefined') {
            notifications.warning('Configuration cleared. Redirecting to setup...');
        }

        setTimeout(() => {
            window.location.href = '/setup';
        }, 1000);
    }
}

async function testCurrentConnection() {
    const apiUrl = sessionStorage.getItem('manuals_api_url');
    const apiKey = sessionStorage.getItem('manuals_api_key');
    const resultDiv = document.getElementById('test-result');

    if (!apiUrl || !apiKey) {
        showTestResult(false, 'No configuration found');
        if (typeof notifications !== 'undefined') {
            notifications.warning('No API configuration found');
        }
        return;
    }

    resultDiv.innerHTML = '<p class="text-sm text-gray-600">Testing connection...</p>';
    resultDiv.classList.remove('hidden');

    try {
        const response = await fetch(`${apiUrl}/api/2025.12/status`, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const message = `Connected successfully! API Status: ${data.status}`;
        showTestResult(true, message);

        if (typeof notifications !== 'undefined') {
            notifications.success(message);
        }
    } catch (error) {
        showTestResult(false, error.message);

        if (typeof notifications !== 'undefined') {
            notifications.error(`Connection test failed: ${error.message}`);
        }
    }
}

function showTestResult(success, message) {
    const resultDiv = document.getElementById('test-result');
    const bgColor = success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
    const textColor = success ? 'text-green-800' : 'text-red-800';
    const icon = success ? '✓' : '✗';

    resultDiv.className = `border rounded-md p-4 ${bgColor}`;
    resultDiv.innerHTML = `
        <p class="text-sm font-medium ${textColor}">
            ${icon} ${message}
        </p>
    `;
    resultDiv.classList.remove('hidden');
}
