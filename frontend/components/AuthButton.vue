<template>
  <div class="auth-button">
    <!-- Show login button when not authenticated -->
    <button
      v-if="!isAuthenticated && isOIDCConfigured"
      @click="handleLogin"
      :disabled="loading"
      class="px-4 py-2 rounded-lg
             bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500
             text-white text-sm font-semibold
             hover:shadow-lg hover:scale-105
             active:scale-95
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-all duration-300">
      <span v-if="loading">Signing in...</span>
      <span v-else>Sign In</span>
    </button>

    <!-- Show user info and logout when authenticated -->
    <div v-else-if="isAuthenticated" class="flex items-center space-x-3">
      <!-- User info -->
      <div class="text-right">
        <p class="text-sm font-semibold text-white">{{ userName }}</p>
        <p class="text-xs text-gray-400">{{ userEmail }}</p>
      </div>

      <!-- Logout button -->
      <button
        @click="handleLogout"
        :disabled="loading"
        class="px-3 py-1.5 rounded-lg
               bg-gray-800/50
               border border-gray-700/30
               text-gray-300 text-sm
               hover:bg-gray-700/50 hover:text-white
               active:scale-95
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-all duration-200">
        Sign Out
      </button>
    </div>

    <!-- Show nothing if OIDC not configured (anonymous mode) -->
    <div v-else-if="!isOIDCConfigured" class="text-xs text-gray-500">
      Anonymous Mode
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, isAuthenticated, isOIDCConfigured, init, signIn, signOut } = useAuth()
const loading = ref(false)

const userName = computed(() => {
  if (!user.value) return ''
  return user.value.profile?.name || user.value.profile?.email || 'User'
})

const userEmail = computed(() => {
  if (!user.value) return ''
  return user.value.profile?.email || ''
})

async function handleLogin() {
  loading.value = true
  try {
    await signIn()
  } catch (error) {
    console.error('Login failed:', error)
    alert('Login failed. Please try again.')
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  loading.value = true
  try {
    await signOut()
  } catch (error) {
    console.error('Logout failed:', error)
    alert('Logout failed. Please try again.')
  } finally {
    loading.value = false
  }
}

// Initialize auth on mount
onMounted(async () => {
  await init()
})
</script>

<style scoped>
.auth-button {
  display: flex;
  align-items: center;
}
</style>
