<template>
  <div class="glass-card p-4">
    <div class="text-center mb-3">
      <h2 class="text-lg font-bold text-white mb-1">
        Quick Search
      </h2>
      <p class="text-xs text-gray-400">
        Search across all hardware documentation, datasheets, and guides
      </p>
    </div>

    <Combobox v-model="selectedItem" @update:modelValue="handleSearch">
      <div class="relative">
        <!-- Search Input with Icon -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>

          <ComboboxInput
            class="w-full pl-10 pr-20 py-2 text-sm
                   bg-gray-800/50
                   border border-gray-700/30
                   rounded-lg backdrop-blur-sm
                   text-white
                   placeholder-gray-500
                   focus:outline-none focus:border-sky-500
                   focus:ring-2 focus:ring-sky-500/20
                   transition-all duration-300
                   hover:border-sky-400"
            placeholder="ESP32, BME280, I2C..."
            @change="query = $event.target.value"
            :display-value="(item) => item?.name || ''"
          />

          <!-- Search Button -->
          <button
            type="button"
            @click="handleSearch"
            class="absolute right-1 top-1/2 -translate-y-1/2
                   px-3 py-1.5 rounded-md
                   bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500
                   text-white text-xs font-semibold
                   hover:shadow-lg hover:scale-105
                   active:scale-95
                   transition-all duration-300">
            Search
          </button>
        </div>

        <!-- Suggestions Dropdown -->
        <TransitionRoot
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions
            class="absolute z-10 mt-4 w-full
                   glass-card p-2
                   max-h-96 overflow-auto">
            <div v-if="filteredSuggestions.length === 0 && query !== ''"
                 class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <SparklesIcon class="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No results found. Try a different search term!</p>
            </div>

            <ComboboxOption
              v-for="suggestion in filteredSuggestions"
              :key="suggestion.id"
              :value="suggestion"
              v-slot="{ active, selected }"
              class="cursor-pointer">
              <div :class="[
                'px-3 py-2 rounded-lg transition-all duration-200',
                active ? 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 scale-105' : ''
              ]">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="text-xl">{{ suggestion.icon }}</span>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ suggestion.name }}
                      </p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        {{ suggestion.category }}
                      </p>
                    </div>
                  </div>
                  <CheckIcon v-if="selected" class="h-4 w-4 text-sky-500" />
                </div>
              </div>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>

    <!-- Popular Searches -->
    <div class="mt-3 flex flex-wrap gap-1.5 justify-center">
      <span class="text-xs text-gray-500 mr-1">Popular:</span>
      <button
        v-for="tag in popularTags"
        :key="tag"
        @click="query = tag"
        class="px-2 py-0.5 rounded text-xs font-medium
               bg-gray-800/50
               border border-gray-700/30
               text-gray-300
               hover:bg-gradient-to-r hover:from-sky-500 hover:to-cyan-500
               hover:text-white hover:border-transparent
               transition-all duration-200
               hover:scale-105 active:scale-95">
        {{ tag }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot
} from '@headlessui/vue'
import { MagnifyingGlassIcon, CheckIcon, SparklesIcon } from '@heroicons/vue/24/outline'

const query = ref('')
const selectedItem = ref(null)

const suggestions = ref([
  { id: 1, name: 'ESP32', category: 'Microcontroller', icon: '🔌' },
  { id: 2, name: 'BME280', category: 'Sensor', icon: '🌡️' },
  { id: 3, name: 'I2C Protocol', category: 'Protocol', icon: '📡' },
  { id: 4, name: 'Arduino Uno', category: 'Development Board', icon: '🎮' },
  { id: 5, name: 'Raspberry Pi', category: 'Single Board Computer', icon: '🥧' }
])

const popularTags = ref(['ESP32', 'Arduino', 'Sensors', 'I2C', 'SPI'])

const filteredSuggestions = computed(() => {
  if (query.value === '') return []

  return suggestions.value.filter((item) =>
    item.name.toLowerCase().includes(query.value.toLowerCase()) ||
    item.category.toLowerCase().includes(query.value.toLowerCase())
  )
})

const handleSearch = () => {
  if (query.value || selectedItem.value) {
    console.log('Searching for:', query.value || selectedItem.value.name)
    // Navigate to search results
    window.location.href = `/search?q=${encodeURIComponent(query.value || selectedItem.value.name)}`
  }
}
</script>
