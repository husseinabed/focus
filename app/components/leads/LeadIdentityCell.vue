<script setup lang="ts">
import type { Lead } from '~/types/leads'

const props = defineProps<{
  row: Lead
}>()

const name = computed(() => props.row.full_name || props.row.company_name)
const subtext = computed(() => {
  if (props.row.full_name && props.row.company_name) {
    return props.row.company_name
  }
  return props.row.email || props.row.phone
})
</script>

<template>
  <div class="flex items-center gap-2">
    <UAvatar
      :alt="name"
      size="sm"
    />
    <div class="flex flex-col">
      <span class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
        {{ name }}
      </span>
      <span v-if="subtext" class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
        {{ subtext }}
      </span>
    </div>
  </div>
</template>
