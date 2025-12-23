<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <button
          @click="goBack"
          class="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-white">Search Results</h1>
          <p class="text-gray-400 text-sm">
            {{ results.length }} results for "{{ query }}"
            <span v-if="mode === 'semantic'" class="text-cyan-400">(semantic)</span>
          </p>
        </div>
      </div>
      <AuthButton />
    </div>

    <!-- Search input -->
    <div class="mb-6">
      <div class="flex space-x-4">
        <input
          v-model="searchInput"
          @keyup.enter="performSearch"
          type="text"
          placeholder="Search documentation..."
          class="flex-1 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/30 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50">
        <select
          v-model="searchMode"
          class="px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/30 text-white focus:outline-none focus:border-cyan-500/50">
          <option value="semantic">Semantic</option>
          <option value="keyword">Keyword</option>
        </select>
        <button
          @click="performSearch"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:shadow-lg transition-shadow">
          Search
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-400">{{ error }}</p>
    </div>

    <!-- Results -->
    <div v-else class="space-y-4">
      <router-link
        v-for="result in results"
        :key="result.device_id"
        :to="`/devices/${result.device_id}`"
        class="block p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-semibold text-white">{{ result.name }}</h3>
          <div class="flex items-center space-x-2">
            <span class="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
              {{ result.domain }}
            </span>
            <span v-if="result.score" class="px-2 py-1 text-xs rounded-full bg-gray-700/50 text-gray-400">
              {{ (result.score * 100).toFixed(0) }}%
            </span>
          </div>
        </div>
        <div v-if="result.snippet" class="text-sm text-gray-400 line-clamp-3 prose prose-sm prose-invert max-w-none" v-html="renderMarkdown(result.snippet)"></div>
        <div v-else-if="result.content" class="text-sm text-gray-400 line-clamp-3 prose prose-sm prose-invert max-w-none" v-html="renderMarkdown(result.content.substring(0, 500))"></div>
      </router-link>

      <!-- Empty state -->
      <div v-if="results.length === 0 && query" class="text-center py-12">
        <p class="text-gray-400">No results found for "{{ query }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import { useMarkdown } from '../composables/useMarkdown'
import AuthButton from '../components/AuthButton.vue'

const route = useRoute()
const router = useRouter()
const { searchDevices, semanticSearch } = useApi()
const { renderMarkdown } = useMarkdown()

const query = ref('')
const mode = ref('semantic')
const searchInput = ref('')
const searchMode = ref('semantic')
const results = ref([])
const loading = ref(false)
const error = ref(null)

function goBack() {
  router.push('/')
}

async function performSearch() {
  if (!searchInput.value.trim()) return

  router.push({
    path: '/search',
    query: { q: searchInput.value, mode: searchMode.value }
  })
}

async function executeSearch() {
  if (!query.value) return

  loading.value = true
  error.value = null

  try {
    let data
    if (mode.value === 'semantic') {
      data = await semanticSearch(query.value)
    } else {
      data = await searchDevices(query.value)
    }
    results.value = data.results || []
  } catch (err) {
    console.error('Search error:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Watch for route changes
watch(
  () => route.query,
  (newQuery) => {
    query.value = newQuery.q || ''
    mode.value = newQuery.mode || 'semantic'
    searchInput.value = query.value
    searchMode.value = mode.value
    if (query.value) {
      executeSearch()
    }
  },
  { immediate: true }
)

onMounted(() => {
  query.value = route.query.q || ''
  mode.value = route.query.mode || 'semantic'
  searchInput.value = query.value
  searchMode.value = mode.value
  if (query.value) {
    executeSearch()
  }
})
</script>
