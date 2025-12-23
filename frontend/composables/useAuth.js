import { ref, computed } from 'vue'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

// OIDC configuration from environment variables
// In production, these would come from import.meta.env or similar
const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || '',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || '',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage })
}

// Create UserManager instance (only if OIDC is configured)
let userManager = null
if (oidcConfig.authority && oidcConfig.client_id) {
  userManager = new UserManager(oidcConfig)
}

// Reactive state
const user = ref(null)
const isAuthenticated = computed(() => !!user.value && !user.value.expired)
const accessToken = computed(() => user.value?.access_token || null)

/**
 * OIDC Authentication Composable
 * Provides authentication state and methods for the Vue app
 */
export function useAuth() {
  /**
   * Initialize auth state by checking for existing user session
   */
  async function init() {
    if (!userManager) {
      console.warn('OIDC not configured - authentication disabled')
      return
    }

    try {
      const storedUser = await userManager.getUser()
      if (storedUser && !storedUser.expired) {
        user.value = storedUser
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    }

    // Set up event listeners
    userManager.events.addUserLoaded((loadedUser) => {
      user.value = loadedUser
    })

    userManager.events.addUserUnloaded(() => {
      user.value = null
    })

    userManager.events.addAccessTokenExpired(() => {
      console.log('Access token expired')
      user.value = null
    })
  }

  /**
   * Sign in - redirects to OIDC provider
   */
  async function signIn() {
    if (!userManager) {
      throw new Error('OIDC not configured')
    }

    try {
      await userManager.signinRedirect()
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Handle callback after redirect from OIDC provider
   * Call this on the callback page
   */
  async function handleCallback() {
    if (!userManager) {
      throw new Error('OIDC not configured')
    }

    try {
      const callbackUser = await userManager.signinRedirectCallback()
      user.value = callbackUser
      return callbackUser
    } catch (error) {
      console.error('Callback error:', error)
      throw error
    }
  }

  /**
   * Sign out - clears session and redirects to OIDC provider
   */
  async function signOut() {
    if (!userManager) {
      throw new Error('OIDC not configured')
    }

    try {
      await userManager.signoutRedirect()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Silent token renewal
   */
  async function renewToken() {
    if (!userManager) {
      throw new Error('OIDC not configured')
    }

    try {
      const renewedUser = await userManager.signinSilent()
      user.value = renewedUser
      return renewedUser
    } catch (error) {
      console.error('Token renewal error:', error)
      throw error
    }
  }

  /**
   * Check if OIDC is configured
   */
  const isOIDCConfigured = computed(() => !!userManager)

  return {
    // State
    user,
    isAuthenticated,
    accessToken,
    isOIDCConfigured,

    // Methods
    init,
    signIn,
    signOut,
    handleCallback,
    renewToken
  }
}
