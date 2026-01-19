<script setup lang="ts">
// Define props for left and right component arrays
interface ComponentDefinition {
  component: string; // e.g., 'UToggle', 'UChip'
  props?: Record<string, any>;
}

const props = defineProps<{
  left: ComponentDefinition[];
  right: ComponentDefinition[];
}>();
</script>

<template>
  <div class="sticky bottom-0 z-10 w-full bg-white shadow-lg border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <component
          v-for="(item, index) in props.left"
          :key="`left-${index}`"
          :is="item.component"
          v-bind="item.props"
        />
      </div>
      <div class="flex items-center space-x-2">
        <component
          v-for="(item, index) in props.right"
          :key="`right-${index}`"
          :is="item.component"
          v-bind="item.props"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles here if needed */
</style>
