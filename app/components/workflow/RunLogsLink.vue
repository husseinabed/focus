<template>
  <ULink
    :to="resolvedRoute"
    active-class="text-primary"
    inactive-class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
  >
    Run Logs
  </ULink>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  to: string
  params: {
    idFrom: string
    run_idFrom: string | null
  }
}>()

const workflowId = computed(() => props.params.idFrom);
const runId = computed(() => props.params.run_idFrom);

const resolvedRoute = computed(() => {
  // This constructs the `to` object for ULink.
  // The `params` object for ULink uses keys `id` and `run_id`
  // which correspond to the placeholders in the `to` path template.
  return {
    path: props.to,
    params: {
      id: workflowId.value,
      run_id: runId.value,
    },
  }
})
</script>
