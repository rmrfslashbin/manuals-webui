import { ref, computed } from 'vue'

// API version
const API_VERSION = '2025.12'

// Reactive state
const user = ref(null)
const loading = ref(false)
const error = ref(null)

// Computed properties
const isAuthenticated = computed(() => !!user.value)
const profile = computed(() => user.value || null)

/**
 * BFF Authentication Composable
 *
 * Uses Backend-for-Frontend pattern where the API server manages OIDC flow.
 * Authentication is handled via HTTP-only cookies set by the server.
 */
export function useAuth() {
  /**
   * Initialize auth state by checking current session with the API
   */
  async function init() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/${API_VERSION}/auth/me`, {
        credentials: 'include', // Send cookies
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          user.value = data.user
        } else {
          user.value = null
        }
      } else {
        user.value = null
      }
    } catch (err) {
      console.error('Failed to check auth status:', err)
      error.value = err.message
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in - redirects to BFF login endpoint which handles OIDC flow
   * @param {string} returnUrl - URL to return to after login (defaults to current page)
   */
  function signIn(returnUrl = window.location.href) {
    const loginUrl = `/api/${API_VERSION}/auth/login?return_url=${encodeURIComponent(returnUrl)}`
    window.location.href = loginUrl
  }

  /**
   * Sign out - redirects to BFF logout endpoint
   * @param {boolean} fullLogout - Also logout from OIDC provider (default: false)
   */
  function signOut(fullLogout = false) {
    const logoutUrl = `/api/${API_VERSION}/auth/logout${fullLogout ? '?full=true' : ''}`
    window.location.href = logoutUrl
  }

  /**
   * Check for auth error in URL (set by callback handler on error)
   */
  function checkAuthError() {
    const urlParams = new URLSearchParams(window.location.search)
    const authError = urlParams.get('auth_error')
    if (authError) {
      error.value = authError
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_error')
      window.history.replaceState({}, '', url.toString())
    }
  }

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    profile,

    // Methods
    init,
    signIn,
    signOut,
    checkAuthError,

    // Legacy compatibility (access token not available in BFF pattern)
    accessToken: computed(() => null),
    isOIDCConfigured: computed(() => true), // BFF is always "configured" if endpoints exist
  }
}
