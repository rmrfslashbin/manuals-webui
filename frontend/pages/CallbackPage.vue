<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div v-if="!error" class="space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent mx-auto"></div>
        <h2 class="text-xl font-semibold text-white">Completing Sign In...</h2>
        <p class="text-gray-400">Please wait while we complete your authentication.</p>
      </div>
      <div v-else class="space-y-4">
        <div class="text-red-500 text-5xl">!</div>
        <h2 class="text-xl font-semibold text-red-400">Authentication Failed</h2>
        <p class="text-gray-400">{{ error }}</p>
        <button
          @click="goHome"
          class="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
          Return Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { handleCallback } = useAuth()
const error = ref(null)

function goHome() {
  router.push('/')
}

onMounted(async () => {
  try {
    await handleCallback()
    // Redirect to home on success
    router.push('/')
  } catch (err) {
    console.error('Callback error:', err)
    error.value = err.message || 'An error occurred during authentication'
  }
})
</script>
