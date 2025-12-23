<template>
  <div class="min-h-screen gradient-bg transition-colors duration-500">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

const { init } = useAuth()

// Initialize auth on app mount
onMounted(async () => {
  await init()
})
</script>
