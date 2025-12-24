<template>
  <div>
    <h2 class="text-lg font-bold text-center text-white mb-3">
      Explore by Category
    </h2>

    <!-- Bento Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      <router-link
        v-for="(category, index) in categories"
        :key="category.id"
        :to="`/devices?domain=${category.id}`"
        :class="[
          'group relative overflow-hidden rounded-xl',
          'backdrop-blur-xl bg-gray-800/40 border border-gray-700/40',
          'hover:border-cyan-500/50 hover:bg-gray-800/60',
          'transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10',
          category.large ? 'md:col-span-2 md:row-span-2' : ''
        ]"
        :style="{ animationDelay: `${index * 100}ms` }">

        <!-- Gradient Border on Hover -->
        <div :class="[
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10',
          'transition-opacity duration-500 pointer-events-none',
          category.gradient
        ]"></div>

        <!-- Content -->
        <div class="relative p-4 h-full flex items-center justify-between">
          <!-- Icon & Text -->
          <div class="flex items-center space-x-3 flex-1">
            <div class="text-4xl transform group-hover:scale-110 transition-transform duration-300">
              {{ category.icon }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-0.5">
                {{ category.title }}
              </h3>
              <p class="text-xs text-gray-400">
                {{ category.description }}
              </p>
            </div>
          </div>

          <!-- Arrow Icon -->
          <div :class="[
            'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center',
            'transform group-hover:translate-x-1 transition-all duration-300',
            'opacity-60 group-hover:opacity-100',
            category.gradient
          ]">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Additional CTA Section -->
    <div class="mt-4 text-center glass-card p-4">
      <h3 class="text-sm font-bold text-white mb-1">
        Can't find what you're looking for?
      </h3>
      <p class="text-xs text-gray-400 mb-3">
        Browse all {{ totalCount }}+ devices and documents
      </p>
      <router-link to="/devices"
         class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg
                bg-gradient-to-r from-cyan-500 to-teal-600
                text-white font-semibold text-xs
                hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-105
                active:scale-95
                transition-all duration-300">
        <span>View All Devices</span>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
})

const totalCount = computed(() => 60) // This could be fetched from API
</script>

<style scoped>
a {
  animation: staggerIn 0.5s ease-out both;
  min-height: 80px;
  display: flex;
}

/* Larger card for featured category */
a.md\:col-span-2.md\:row-span-2 {
  min-height: 120px;
}
</style>
