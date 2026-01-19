<script setup lang="ts">
const props = defineProps({
  status: {
    type: String as PropType<
      'scheduled' | 'completed' | 'canceled' | 'no_show'
    >,
    required: true,
  },
});

const statusDisplay = computed(() => {
  switch (props.status) {
    case 'scheduled':
      return { label: 'Scheduled', color: 'blue', icon: 'i-heroicons-clock' };
    case 'completed':
      return { label: 'Completed', color: 'green', icon: 'i-heroicons-check-circle' };
    case 'canceled':
      return { label: 'Canceled', color: 'red', icon: 'i-heroicons-x-circle' };
    case 'no_show':
      return { label: 'No Show', color: 'gray', icon: 'i-heroicons-user-slash' };
    default:
      return { label: 'Unknown', color: 'gray', icon: 'i-heroicons-question-mark-circle' };
  }
});
</script>

<template>
  <UChip
    :color="statusDisplay.color"
    :icon="statusDisplay.icon"
    size="sm"
    variant="subtle"
    :label="statusDisplay.label"
  />
</template>
