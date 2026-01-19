<script setup lang="ts">
import WorkflowNodeBase from "~~/app/components/workflow/node/Base.vue"

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.condition == null) {
    props.node.data.config.condition = ''
  }
}
</script>

<template>
  <WorkflowNodeBase>
    <template #title>
      Decision
    </template>
    <template #content>
      <!-- Decision node specific content here -->
      <div class="p-2">
        <UFormField label="Condition" name="condition">
          <UInput :model-value="node.data.config.condition" readonly class="w-full" />
        </UFormField>
      </div>
    </template>
  </WorkflowNodeBase>
</template>
