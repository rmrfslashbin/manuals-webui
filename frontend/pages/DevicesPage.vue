<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header with back button -->
    <div class="flex items-center space-x-4 mb-6">
      <button
        @click="goBack"
        class="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-white">{{ pageTitle }}</h1>
        <p class="text-gray-400 text-sm">{{ devices.length }} devices found</p>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex space-x-2 mb-6">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="setFilter(filter.value)"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          currentFilter === filter.value
            ? 'bg-cyan-500 text-white'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
        ]">
        {{ filter.label }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-400">{{ error }}</p>
      <button @click="fetchDevices" class="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
        Retry
      </button>
    </div>

    <!-- Devices grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="device in devices"
        :key="device.id"
        :to="`/devices/${device.id}`"
        class="block p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-white">{{ device.name }}</h3>
            <p class="text-sm text-gray-400 mt-1">{{ device.type }}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
            {{ device.domain }}
          </span>
        </div>
      </router-link>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && !error && devices.length === 0" class="text-center py-12">
      <p class="text-gray-400">No devices found</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'

const route = useRoute()
const router = useRouter()
const { getDevices } = useApi()

const devices = ref([])
const loading = ref(true)
const error = ref(null)
const currentFilter = ref('all')

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Hardware', value: 'hardware' },
  { label: 'Software', value: 'software' }
]

const pageTitle = computed(() => {
  if (currentFilter.value === 'hardware') return 'Hardware Devices'
  if (currentFilter.value === 'software') return 'Software'
  return 'All Devices'
})

function goBack() {
  router.push('/')
}

function setFilter(filter) {
  currentFilter.value = filter
  if (filter === 'all') {
    router.push('/devices')
  } else {
    router.push(`/devices?domain=${filter}`)
  }
}

async function fetchDevices() {
  loading.value = true
  error.value = null

  try {
    const domain = route.query.domain || ''
    const filters = domain ? { domain } : {}
    const data = await getDevices(filters)
    devices.value = data.data || []
  } catch (err) {
    console.error('Error fetching devices:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Watch for route changes
watch(() => route.query.domain, (newDomain) => {
  currentFilter.value = newDomain || 'all'
  fetchDevices()
})

onMounted(() => {
  currentFilter.value = route.query.domain || 'all'
  fetchDevices()
})
</script>
