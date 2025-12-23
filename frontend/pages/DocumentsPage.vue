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
          <h1 class="text-2xl font-bold text-white">Documents</h1>
          <p class="text-gray-400 text-sm">{{ documents.length }} documents available</p>
        </div>
      </div>
      <AuthButton />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-400">{{ error }}</p>
      <button @click="fetchDocuments" class="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg">
        Retry
      </button>
    </div>

    <!-- Documents list -->
    <div v-else class="space-y-3">
      <a
        v-for="doc in documents"
        :key="doc.id"
        :href="getDocumentUrl(doc.id)"
        target="_blank"
        class="flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50 hover:border-cyan-500/30 transition-all">
        <div class="flex items-center space-x-4">
          <div class="p-2 rounded-lg bg-cyan-500/20">
            <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 class="font-medium text-white">{{ doc.filename }}</h3>
            <p class="text-sm text-gray-400">{{ doc.mime_type }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-400">{{ formatSize(doc.size) }}</p>
        </div>
      </a>

      <!-- Empty state -->
      <div v-if="documents.length === 0" class="text-center py-12">
        <p class="text-gray-400">No documents found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import AuthButton from '../components/AuthButton.vue'

const router = useRouter()
const { getDocuments } = useApi()

const documents = ref([])
const loading = ref(true)
const error = ref(null)

// Document downloads go through same-origin nginx proxy

function goBack() {
  router.push('/')
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}

function getDocumentUrl(docId) {
  return `/api/2025.12/documents/${docId}/download`
}

async function fetchDocuments() {
  loading.value = true
  error.value = null

  try {
    const data = await getDocuments()
    documents.value = data.data || []
  } catch (err) {
    console.error('Error fetching documents:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>
