<script setup lang="ts">
import WorkflowNodeBase from "~~/app/components/workflow/node/Base.vue"

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.duration == null) {
    props.node.data.config.duration = 0
  }
  if (props.node.data.config.unit == null) {
    props.node.data.config.unit = ''
  }
}
</script>

<template>
  <WorkflowNodeBase>
    <template #title>
      Delay
    </template>
    <template #content>
      <!-- Delay node specific content here -->
      <div class="p-2">
        <UFormField label="Duration" name="duration">
          <UInput :model-value="node.data.config.duration" readonly class="w-full" />
        </UFormField>
        <UFormField label="Unit" name="unit">
          <UInput :model-value="node.data.config.unit" readonly class="w-full" />
        </UFormField>
      </div>
    </template>
  </WorkflowNodeBase>
</template>
