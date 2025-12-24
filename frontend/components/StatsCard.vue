<template>
  <div
    class="glass-card p-3 group cursor-pointer"
    :style="{ animationDelay: `${delay}ms` }"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-2xl group-hover:scale-110 transition-transform duration-300">
        {{ icon }}
      </span>
      <div class="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500
                  flex items-center justify-center opacity-50 group-hover:opacity-100
                  transition-opacity duration-300">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>
      </div>
    </div>

    <div>
      <div class="flex items-center gap-2 mb-0.5">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {{ label }}
        </p>
        <div v-if="showHealth"
             :class="[
               'w-2 h-2 rounded-full transition-colors duration-300',
               healthy ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
             ]"
             :title="healthy ? 'API Healthy' : 'API Unavailable'">
        </div>
      </div>
      <p class="text-xl font-bold text-white">
        {{ animatedValue }}
      </p>
    </div>

    <!-- Decorative gradient bar -->
    <div class="mt-2 h-0.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500
                rounded-full transform scale-x-0 group-hover:scale-x-100
                transition-transform duration-500 origin-left">
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  label: String,
  value: String,
  icon: String,
  delay: {
    type: Number,
    default: 0
  },
  showHealth: {
    type: Boolean,
    default: false
  },
  healthy: {
    type: Boolean,
    default: false
  }
})

const animatedValue = ref('0')

// Animate number counting
const animateValue = () => {
  const target = props.value
  if (isNaN(target)) {
    animatedValue.value = target
    return
  }

  const targetNum = parseFloat(target)
  const duration = 1000
  const steps = 60
  const increment = targetNum / steps
  let current = 0

  const timer = setInterval(() => {
    current += increment
    if (current >= targetNum) {
      animatedValue.value = target
      clearInterval(timer)
    } else {
      animatedValue.value = Math.floor(current).toString()
    }
  }, duration / steps)
}

onMounted(() => {
  setTimeout(() => {
    animateValue()
  }, props.delay)
})
</script>

<style scoped>
.glass-card {
  animation: staggerIn 0.5s ease-out both;
}
</style>
