<template>
  <div class="min-h-screen gradient-bg transition-colors duration-500">
    <NavigationBar />
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import NavigationBar from './components/NavigationBar.vue'

const { init } = useAuth()

// Initialize auth on app mount
onMounted(async () => {
  await init()
})
</script>
