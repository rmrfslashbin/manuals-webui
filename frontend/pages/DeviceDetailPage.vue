<template>
  <div class="min-h-screen bg-gray-950">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header with back button -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors border border-gray-700/30">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-white">{{ device?.name || 'Loading...' }}</h1>
            <div class="flex items-center space-x-2 mt-1">
              <span class="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {{ device?.domain }}
              </span>
              <span class="text-gray-500">•</span>
              <span class="text-gray-400 text-sm">{{ device?.type }}</span>
            </div>
          </div>
        </div>
        <AuthButton />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-10 w-10 border-2 border-cyan-500 border-t-transparent"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button @click="fetchDevice" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
          Retry
        </button>
      </div>

      <!-- Device content -->
      <div v-else-if="device" class="space-y-6">
        <!-- Metadata badges -->
        <div class="flex flex-wrap gap-2">
          <span v-if="cleanMetadata.manufacturer" class="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
            <span class="text-blue-500/60 mr-1">Manufacturer:</span> {{ cleanMetadata.manufacturer }}
          </span>
          <span v-if="cleanMetadata.model" class="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-sm border border-purple-500/20">
            <span class="text-purple-500/60 mr-1">Model:</span> {{ cleanMetadata.model }}
          </span>
          <span v-if="cleanMetadata.version" class="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm border border-green-500/20">
            {{ cleanMetadata.version }}
          </span>
        </div>

        <!-- Tags -->
        <div v-if="parsedTags.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="tag in parsedTags"
            :key="tag"
            class="px-2.5 py-1 rounded-md bg-gray-800/50 text-gray-300 text-xs border border-gray-700/30 hover:border-gray-600/50 transition-colors">
            {{ tag }}
          </span>
        </div>

        <!-- Two column layout for specs and documentation -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left column: Specifications -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Specs from metadata -->
            <div v-if="specsList.length > 0" class="rounded-xl bg-gray-900/50 border border-gray-800/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-800/50">
                <h2 class="text-lg font-semibold text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Specifications
                </h2>
              </div>
              <div class="divide-y divide-gray-800/50">
                <div v-for="spec in specsList" :key="spec.key" class="px-5 py-3 hover:bg-gray-800/30 transition-colors">
                  <dt class="text-xs text-gray-500 uppercase tracking-wide mb-1">{{ spec.label }}</dt>
                  <dd class="text-sm text-white">{{ spec.value }}</dd>
                </div>
              </div>
            </div>

            <!-- Documents section -->
            <div v-if="documents && documents.length > 0" class="rounded-xl bg-gray-900/50 border border-gray-800/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-800/50">
                <h2 class="text-lg font-semibold text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Documents
                </h2>
              </div>
              <div class="divide-y divide-gray-800/50">
                <a
                  v-for="doc in documents"
                  :key="doc.id"
                  :href="getDocumentUrl(doc.id)"
                  target="_blank"
                  class="flex items-center justify-between px-5 py-3 hover:bg-gray-800/30 transition-colors group">
                  <div class="flex items-center space-x-3 min-w-0">
                    <svg class="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span class="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{{ doc.filename }}</span>
                  </div>
                  <span class="text-xs text-gray-500 flex-shrink-0 ml-2">{{ formatSize(doc.size_bytes) }}</span>
                </a>
              </div>
            </div>

            <!-- References section -->
            <div v-if="refs && (refs.related_devices?.length > 0 || refs.external_links?.length > 0)" class="rounded-xl bg-gray-900/50 border border-gray-800/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-800/50">
                <h2 class="text-lg font-semibold text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  References
                </h2>
              </div>
              <div class="p-5 space-y-4">
                <!-- Related Devices -->
                <div v-if="refs.related_devices?.length > 0">
                  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Related Devices</h3>
                  <div class="flex flex-wrap gap-2">
                    <router-link
                      v-for="related in refs.related_devices"
                      :key="related.id"
                      :to="`/devices/${related.id}`"
                      class="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors border border-cyan-500/20">
                      {{ related.name }}
                    </router-link>
                  </div>
                </div>

                <!-- External Links -->
                <div v-if="refs.external_links?.length > 0">
                  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">External Links</h3>
                  <div class="space-y-2">
                    <a
                      v-for="(link, index) in refs.external_links"
                      :key="index"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span class="truncate">{{ link.title || link.url }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column: Documentation content -->
          <div class="lg:col-span-2">
            <div class="rounded-xl bg-gray-900/50 border border-gray-800/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-800/50">
                <h2 class="text-lg font-semibold text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentation
                </h2>
              </div>
              <div class="p-5">
                <div v-if="renderedContent" class="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-semibold
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white
                  prose-code:text-cyan-400 prose-code:bg-gray-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800/50
                  prose-ul:text-gray-300 prose-ol:text-gray-300
                  prose-li:marker:text-gray-600
                  prose-blockquote:border-cyan-500/50 prose-blockquote:text-gray-400
                  prose-hr:border-gray-800"
                  v-html="renderedContent">
                </div>
                <div v-else class="text-center py-12">
                  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
                    <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p class="text-gray-500 mb-2">No documentation available</p>
                  <p class="text-gray-600 text-sm">Check the specifications and documents sections for more information.</p>
                </div>
              </div>
            </div>

            <!-- Pinout section (full width in right column) -->
            <div v-if="pinout && pinout.length > 0" class="mt-6 rounded-xl bg-gray-900/50 border border-gray-800/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-gray-800/50">
                <h2 class="text-lg font-semibold text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Pinout
                </h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800/50">
                      <th class="py-3 px-5 font-medium">Pin</th>
                      <th class="py-3 px-5 font-medium">Name</th>
                      <th class="py-3 px-5 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-800/30">
                    <tr v-for="pin in pinout" :key="pin.physical_pin" class="hover:bg-gray-800/30 transition-colors">
                      <td class="py-3 px-5 text-cyan-400 font-mono">{{ pin.physical_pin }}</td>
                      <td class="py-3 px-5 text-white font-medium">{{ pin.name }}</td>
                      <td class="py-3 px-5 text-gray-400">{{ pin.description || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import { useMarkdown } from '../composables/useMarkdown'
import AuthButton from '../components/AuthButton.vue'

const route = useRoute()
const router = useRouter()
const { getDevice, getDeviceSpecs, getDevicePinout, getDeviceDocuments, get } = useApi()
const { renderMarkdown } = useMarkdown()

const device = ref(null)
const specs = ref(null)
const pinout = ref(null)
const documents = ref(null)
const refs = ref(null)
const loading = ref(true)
const error = ref(null)

// Clean metadata values (remove extra quotes)
function cleanValue(value) {
  if (typeof value !== 'string') return value
  // Remove surrounding quotes and escaped quotes
  let cleaned = value.replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
  // Also handle double-quoted values like "\"value\""
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }
  return cleaned
}

// Format key for display
function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Clean metadata object
const cleanMetadata = computed(() => {
  if (!device.value?.metadata) return {}
  const result = {}
  for (const [key, value] of Object.entries(device.value.metadata)) {
    result[key] = cleanValue(value)
  }
  return result
})

// Parse tags from string to array
const parsedTags = computed(() => {
  const tagsValue = cleanMetadata.value.tags
  if (!tagsValue) return []

  // Handle "[tag1, tag2, tag3]" format
  if (tagsValue.startsWith('[') && tagsValue.endsWith(']')) {
    return tagsValue
      .slice(1, -1)
      .split(',')
      .map(t => t.trim())
      .filter(t => t)
  }

  // Handle array
  if (Array.isArray(tagsValue)) return tagsValue

  return []
})

// Build specs list from metadata (excluding certain keys)
const specsList = computed(() => {
  const excludeKeys = ['manufacturer', 'model', 'category', 'tags', 'date', 'version', 'specs', 'related_hardware']
  const result = []

  // First add from actual specs endpoint
  if (specs.value && Object.keys(specs.value).length > 0) {
    for (const [key, value] of Object.entries(specs.value)) {
      result.push({
        key,
        label: formatKey(key),
        value: cleanValue(value)
      })
    }
  }

  // Then add from metadata
  for (const [key, value] of Object.entries(cleanMetadata.value)) {
    if (excludeKeys.includes(key)) continue
    if (!value || value === '""' || value === '') continue

    result.push({
      key,
      label: formatKey(key),
      value
    })
  }

  return result
})

const renderedContent = computed(() => {
  if (!device.value?.content) return ''
  return renderMarkdown(device.value.content)
})

function goBack() {
  router.push('/devices')
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}

function getDocumentUrl(docId) {
  return `/api/2025.12/documents/${docId}/download`
}

async function fetchDevice() {
  loading.value = true
  error.value = null

  try {
    const id = route.params.id
    const [deviceData, specsData, pinoutData, docsData, refsData] = await Promise.all([
      getDevice(id),
      getDeviceSpecs(id).catch(() => null),
      getDevicePinout(id).catch(() => null),
      getDeviceDocuments(id).catch(() => null),
      get(`/devices/${id}/refs`).catch(() => null)
    ])

    device.value = deviceData
    specs.value = specsData?.specifications ?
      Object.fromEntries(specsData.specifications.map(s => [s.key, s.value + (s.unit ? ` ${s.unit}` : '')])) :
      null
    pinout.value = pinoutData?.pinouts || null
    documents.value = docsData?.documents || null
    refs.value = refsData || null
  } catch (err) {
    console.error('Error fetching device:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDevice()
})
</script>
