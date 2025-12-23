<template>
  <div>
    <h2 class="text-lg font-bold text-center text-white mb-3">
      Explore by Category
    </h2>

    <!-- Bento Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      <a
        v-for="(category, index) in categories"
        :key="category.id"
        :href="`/devices?domain=${category.id}`"
        :class="[
          'glass-card group relative overflow-hidden',
          category.large ? 'md:col-span-2 md:row-span-2' : ''
        ]"
        :style="{ animationDelay: `${index * 100}ms` }">

        <!-- Gradient Background Overlay -->
        <div :class="[
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20',
          'transition-opacity duration-500',
          category.gradient
        ]"></div>

        <!-- Content -->
        <div class="relative p-3 h-full flex flex-col justify-between">
          <!-- Icon & Title -->
          <div class="space-y-1">
            <div class="text-3xl transform group-hover:scale-110 group-hover:rotate-12
                        transition-all duration-500 inline-block">
              {{ category.icon }}
            </div>

            <h3 class="text-base font-bold text-white
                       transform group-hover:translate-x-2 transition-transform duration-300">
              {{ category.title }}
            </h3>

            <p class="text-xs text-gray-400
                      transform group-hover:translate-x-2 transition-transform duration-300 delay-75">
              {{ category.description }}
            </p>
          </div>

          <!-- Arrow Icon -->
          <div class="flex justify-end mt-1">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br
                        flex items-center justify-center
                        transform group-hover:scale-125 group-hover:rotate-45
                        transition-all duration-500"
                 :class="category.gradient">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          </div>

          <!-- Decorative Elements -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10
                      transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12
                      transition-transform duration-700 rounded-full blur-2xl"
               :class="category.gradient">
          </div>
        </div>

        <!-- Shimmer Effect on Hover -->
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                      -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </a>
    </div>

    <!-- Additional CTA Section -->
    <div class="mt-4 text-center glass-card p-4">
      <h3 class="text-sm font-bold text-white mb-1">
        Can't find what you're looking for?
      </h3>
      <p class="text-xs text-gray-400 mb-3">
        Browse all {{ totalCount }}+ devices and documents
      </p>
      <a href="/devices"
         class="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg
                bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500
                text-white font-semibold text-xs
                hover:shadow-lg hover:scale-105
                active:scale-95
                transition-all duration-300">
        <span>View All Devices</span>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
      </a>
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
.glass-card {
  animation: staggerIn 0.5s ease-out both;
}

/* Ensure consistent card heights in grid */
a.glass-card {
  min-height: 120px;
}

a.glass-card.md\:col-span-2.md\:row-span-2 {
  min-height: 200px;
}
</style>
