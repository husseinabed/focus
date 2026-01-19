<script setup lang="ts">
interface RunSection {
  type: 'RunInput' | 'RunOutput' | 'RunLogsLink';
  // Add any other properties specific to each section type here
  // Potentially other props that these dynamic components would need
  [key: string]: any;
}

enum WorkflowRunPanelVisibility {
  ALWAYS = 'always',
  ON_SUCCESS = 'onSuccess',
  ON_ERROR = 'onError',
  // Add other visibility states as needed
}

const props = defineProps({
  visibleWhen: {
    type: String as () => WorkflowRunPanelVisibility,
    required: true,
  },
  sections: {
    type: Array as () => RunSection[],
    default: () => [],
  },
});

// Placeholder for reactive visibility logic
// This would typically depend on the workflow run's status
const isVisible = computed(() => {
  // For demonstration, let's assume a 'runStatus' is available in a real scenario.
  // For this subtask, we'll make it always true unless 'visibleWhen' is 'never'
  // In a real application, you'd integrate with the actual workflow run status.
  switch (props.visibleWhen) {
    case WorkflowRunPanelVisibility.ALWAYS:
      return true;
    case WorkflowRunPanelVisibility.ON_SUCCESS:
      // return runStatus.value === 'success';
      return false; // Placeholder
    case WorkflowRunPanelVisibility.ON_ERROR:
      // return runStatus.value === 'error';
      return false; // Placeholder
    default:
      return false;
  }
});

// Map section types to component names. Assuming these components are globally available or auto-imported by Nuxt.
const sectionComponents: Record<RunSection['type'], string> = {
  RunInput: 'WorkflowRunInput',
  RunOutput: 'WorkflowRunOutput',
  RunLogsLink: 'WorkflowRunLogsLink',
};
</script>

<template>
  <div v-if="isVisible" class="run-panel">
    <div v-for="(section, index) in sections" :key="index" class="mb-4">
      <component
        :is="sectionComponents[section.type]"
        v-bind="section"
      />
    </div>
  </div>
</template>

<style scoped>
.run-panel {
  /* Add your styles here */
}
</style>
