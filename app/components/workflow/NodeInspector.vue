<script setup lang="ts">
const props = defineProps({
  selectedNode: {
    type: Object as () => Record<string, any> | null,
    default: null
  },
  nodeSchema: {
    type: Object as () => Record<string, any>,
    default: () => ({})
  }
})
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <h2 class="text-lg font-semibold mb-4">Node Inspector</h2>

    <div v-if="selectedNode">
      <h3 class="text-md font-medium mb-2">Node Metadata</h3>
      <UFormField label="Label" class="mb-2 w-full">
        <UInput v-model="selectedNode.label" class="w-full" />
      </UFormField>
      <UFormField label="Description" class="mb-4 w-full">
        <UTextarea v-model="selectedNode.description" class="w-full" />
      </UFormField>

      <USeparator class="my-4" />

      <h3 class="text-md font-medium mb-2">Node Configuration</h3>
      <WorkflowNodeForm
        v-if="nodeSchema && Object.keys(nodeSchema).length"
        :node-from="selectedNode"
        :schema-from="nodeSchema"
        class="w-full"
      />
      <p v-else class="text-sm text-gray-500 dark:text-gray-400">
        This node has no configurable fields.
      </p>
    </div>
    <div v-else class="text-gray-500 italic">
      Select a node on the canvas to inspect its properties.
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles for the node inspector here */
</style>
