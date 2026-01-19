<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  title: {
    type: [String, Object],
    required: false,
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
  defaultOpen: {
    type: Boolean,
    default: true,
  },
  width: {
    type: String,
    default: "300px",
  },
  side: {
    type: String,
    default: "right", // or 'left'
    validator: (value: string) => ["left", "right"].includes(value),
  },
});

const isOpen = ref(props.defaultOpen);
</script>

<template>
  <div class="workflow-panel">
    <div v-if="isOpen">
      <slot name="emptyState" />
      <slot name="content" />
    </div>
  </div>
</template>

<style scoped>
.workflow-panel {
  display: flex;
  flex-direction: column;
  height: calc(100% - 225px);
  background-color: var(--color-gray-50); /* or whatever background is appropriate */
  overflow-y: auto;
}
</style>
