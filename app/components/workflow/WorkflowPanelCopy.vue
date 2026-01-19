<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: [String, Object],
    required: false
  },
  collapsible: {
    type: Boolean,
    default: false
  },
  defaultOpen: {
    type: Boolean,
    default: true
  },
  width: {
    type: String,
    default: '300px'
  },
  side: {
    type: String,
    default: 'right', // or 'left'
    validator: (value: string) => ['left', 'right'].includes(value)
  }
})

const isOpen = ref(props.defaultOpen)
</script>

<template>
  <div class="workflow-panel" :style="{ width: props.width, [`border-${props.side}`]: '1px solid var(--color-gray-200)' }">
    <UCard :ui="{ body: { padding: 'px-4 py-3 sm:p-4' }, header: { padding: 'px-4 py-3 sm:p-4' } }" class="h-full">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 v-if="title" class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            <template v-if="typeof title === 'string'">{{ title }}</template>
            <template v-else>{{ $t(title.en) }}</template>
          </h3>
          <UButton
            v-if="collapsible"
            :icon="isOpen ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
            variant="ghost"
            square
            @click="isOpen = !isOpen"
          />
        </div>
        <div v-if="$slots.search" class="mt-2">
          <slot name="search" />
        </div>
      </template>

      <div v-if="isOpen">
        <slot name="emptyState" />
        <slot name="content" />
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.workflow-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-gray-50); /* or whatever background is appropriate */
  overflow-y: auto;
}
</style>
