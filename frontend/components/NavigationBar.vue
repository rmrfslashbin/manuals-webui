<template>
  <nav class="sticky top-0 z-50 glass-card border-b border-cyan-500/30 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo / Home Link -->
        <router-link to="/" class="flex items-center space-x-2 group">
          <span class="text-2xl">📚</span>
          <span class="text-xl font-bold gradient-text">Manuals</span>
        </router-link>

        <!-- Search Bar -->
        <div class="flex-1 max-w-2xl mx-8">
          <Combobox v-model="selectedItem" @update:modelValue="handleSearch">
            <div class="relative">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                </div>

                <ComboboxInput
                  class="w-full pl-9 pr-16 py-2 text-sm
                         bg-gray-800/50
                         border border-gray-700/30
                         rounded-lg backdrop-blur-sm
                         text-white
                         placeholder-gray-500
                         focus:outline-none focus:border-cyan-500
                         focus:ring-2 focus:ring-cyan-500/20
                         transition-all duration-300
                         hover:border-cyan-400"
                  placeholder="Search devices, docs..."
                  @change="query = $event.target.value"
                  :display-value="(item) => item?.name || ''"
                />

                <button
                  type="button"
                  @click="handleSearch"
                  class="absolute right-1 top-1/2 -translate-y-1/2
                         px-3 py-1 rounded-md
                         bg-gradient-to-r from-cyan-500 to-teal-600
                         text-white text-xs font-semibold
                         hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105
                         active:scale-95
                         transition-all duration-300">
                  Search
                </button>
              </div>

              <!-- Suggestions Dropdown -->
              <Teleport to="body">
                <TransitionRoot
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <ComboboxOptions
                    class="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-[100] mt-2 w-full max-w-2xl
                           bg-gray-800 border-2 border-cyan-500/50
                           rounded-lg shadow-xl shadow-cyan-500/20
                           backdrop-blur-xl p-2
                           max-h-96 overflow-auto">
                  <div v-if="filteredSuggestions.length === 0 && query !== ''"
                       class="px-4 py-8 text-center">
                    <SparklesIcon class="h-12 w-12 mx-auto mb-2 text-gray-500" />
                    <p class="text-sm font-medium text-gray-300 mb-1">No results found</p>
                    <p class="text-xs text-gray-500">Try searching for "ESP32", "Arduino", or "I2C"</p>
                  </div>

                  <ComboboxOption
                    v-for="suggestion in filteredSuggestions"
                    :key="suggestion.id"
                    :value="suggestion"
                    v-slot="{ active, selected }"
                    class="cursor-pointer">
                    <div :class="[
                      'px-3 py-2 rounded-lg transition-all duration-200',
                      active ? 'bg-gradient-to-r from-cyan-500/30 to-teal-500/30 border border-cyan-400/50' : 'border border-transparent',
                      selected ? 'bg-cyan-500/10' : ''
                    ]">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <span class="text-2xl">{{ suggestion.icon }}</span>
                          <div>
                            <p class="text-sm font-semibold text-white">
                              {{ suggestion.name }}
                            </p>
                            <p class="text-xs text-gray-400">
                              {{ suggestion.category }}
                            </p>
                          </div>
                        </div>
                        <CheckIcon v-if="selected" class="h-5 w-5 text-cyan-400" />
                      </div>
                    </div>
                  </ComboboxOption>
                  </ComboboxOptions>
                </TransitionRoot>
              </Teleport>
            </div>
          </Combobox>
        </div>

        <!-- Auth Button -->
        <AuthButton />
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { MagnifyingGlassIcon, CheckIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import AuthButton from './AuthButton.vue'

const router = useRouter()
const query = ref('')
const selectedItem = ref(null)

const suggestions = ref([
  { id: 1, name: 'ESP32', category: 'Microcontroller', icon: '🔌' },
  { id: 2, name: 'BME280', category: 'Sensor', icon: '🌡️' },
  { id: 3, name: 'I2C Protocol', category: 'Protocol', icon: '📡' },
  { id: 4, name: 'Arduino Uno', category: 'Development Board', icon: '🎮' },
  { id: 5, name: 'Raspberry Pi', category: 'Single Board Computer', icon: '🥧' }
])

const filteredSuggestions = computed(() => {
  if (query.value === '') return []

  return suggestions.value.filter((item) =>
    item.name.toLowerCase().includes(query.value.toLowerCase()) ||
    item.category.toLowerCase().includes(query.value.toLowerCase())
  )
})

const handleSearch = () => {
  if (query.value || selectedItem.value) {
    const searchQuery = query.value || selectedItem.value.name
    router.push({ path: '/search', query: { q: searchQuery, mode: 'semantic' } })
  }
}
</script>
