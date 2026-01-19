<script setup lang="ts">
const props = defineProps({
  fields: {
    type: Array as () => Array<{ label: string; valueFrom: string }>,
    default: () => [],
  },
});
</script>

<template>
  <div class="workflow-summary">
    <div v-for="(field, index) in fields" :key="index" class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
      <span class="text-gray-500 dark:text-gray-400">{{ field.label }}:</span>
      <span class="font-medium">{{ field.valueFrom }}</span>
    </div>
  </div>
</template>

<style scoped>
.workflow-summary {
  /* Add any specific styling for the summary component here */
}
</style>