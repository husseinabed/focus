<script setup lang="ts">
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Action {
  label: string
  action: string
  payload: object
}

defineProps({
  title: {
    type: Object as PropType<Record<string, string>>,
    required: true,
  },
  actions: {
    type: Array as PropType<Action[]>,
    required: true,
  },
})

const emit = defineEmits(['action'])

function handleAction(action: Action) {
  emit('action', action)
}
</script>

<template>
  <UMain class="flex flex-col items-center justify-center h-full w-full py-8">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        {{ t(title[locale] || title.en) }}
      </h2>
      <div class="flex flex-wrap justify-center gap-4">
        <UButton
          v-for="(action, index) in actions"
          :key="index"
          color="primary"
          variant="solid"
          size="lg"
          @click="handleAction(action)"
        >
          {{ t(action.label) }}
        </UButton>
      </div>
    </div>
  </UMain>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
