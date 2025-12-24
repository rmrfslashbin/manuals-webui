<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <!-- Hero Section - Ultra Compact -->
    <div class="text-center mb-4">
      <h1 class="text-3xl md:text-4xl font-bold gradient-text mb-1">
        Manuals
      </h1>
      <p class="text-sm text-gray-400">
        When you need to RTFM.
      </p>
    </div>

    <!-- Stats Cards Grid - Ultra Compact -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <StatsCard
        v-for="(stat, index) in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :icon="stat.icon"
        :delay="index * 100"
        :show-health="stat.showHealth"
        :healthy="apiHealthy"
      />
    </div>

    <!-- Bento Grid Categories - Ultra Compact -->
    <CategoryGrid :categories="categories" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StatsCard from './StatsCard.vue'
import CategoryGrid from './CategoryGrid.vue'
import { useApi } from '../composables/useApi'

const { getStatus } = useApi()
const apiHealthy = ref(false)

const stats = ref([
  { label: 'Total Devices', value: '30', icon: '🔧' },
  { label: 'Total Documents', value: '32', icon: '📚' },
  { label: 'API Version', value: '2025.12', icon: '🚀', showHealth: true }
])

async function checkApiHealth() {
  try {
    await getStatus()
    apiHealthy.value = true
  } catch (error) {
    console.error('API health check failed:', error)
    apiHealthy.value = false
  }
}

onMounted(() => {
  checkApiHealth()
  // Check health every 30 seconds
  setInterval(checkApiHealth, 30000)
})

const categories = ref([
  {
    id: 'hardware',
    title: 'Hardware',
    description: 'MCU boards, sensors, modules, and components',
    icon: '⚡',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'software',
    title: 'Software',
    description: 'SDR software, development tools, and utilities',
    icon: '💻',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'protocols',
    title: 'Protocols',
    description: 'I2C, SPI, UART, and communication protocols',
    icon: '🔌',
    gradient: 'from-blue-500 to-indigo-500'
  }
])
</script>

<style scoped>
/* Component-specific styles can go here */
</style>
