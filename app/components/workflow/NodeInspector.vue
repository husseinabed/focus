<script setup lang="ts">
const { locale } = useI18n();

// Determine if the layout should be RTL
const isRTL = computed(() => locale.value === "he" || locale.value === "ar");
const props = defineProps({
  selectedNode: {
    type: Object as () => Record<string, any> | null,
    default: null,
  },
  nodeSchema: {
    type: Object as () => Record<string, any>,
    default: () => ({}),
  },
});
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <h2 class="text-lg font-semibold mb-4">{{ $t('ui.inspector.title') }}</h2>

    <div v-if="selectedNode">
      <!-- <h3 class="text-md font-medium mb-2">Node Metadata</h3>
      <UFormField label="Label" class="mb-2 w-full">
        <UInput v-model="selectedNode.label" class="w-full" />
      </UFormField>
      <UFormField label="Description" class="mb-4 w-full">
        <UTextarea v-model="selectedNode.description" class="w-full" />
      </UFormField>

      <USeparator class="my-4" /> -->
      <div class="flex items-center gap-2">
        <UIcon :name="nodeSchema.icon" class="shrink-0 size-5" />
        <h3 class="text-md font-medium mb-2">{{ $t(nodeSchema.title) }}</h3>
      </div>
      <div class="text-muted">
        {{ $t(nodeSchema.hint) }}
      </div>
      <WorkflowNodeForm
        v-if="nodeSchema.config && Object.keys(nodeSchema.config).length"
        :node-from="selectedNode"
        :schema-from="nodeSchema"
        class="w-full"
      />
      <p v-else class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t('ui.inspector.noFields') }}
      </p>
    </div>
    <div v-else class="text-gray-500 italic">
      {{ $t('ui.inspector.emptyState.description') }}
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles for the node inspector here */
</style>
