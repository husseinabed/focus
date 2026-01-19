<script setup lang="ts">
import WorkflowNodeBase from "~~/app/components/workflow/node/Base.vue"

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.to == null) {
    props.node.data.config.to = ''
  }
  if (props.node.data.config.subject == null) {
    props.node.data.config.subject = ''
  }
  if (props.node.data.config.body == null) {
    props.node.data.config.body = ''
  }
}
</script>

<template>
  <WorkflowNodeBase>
    <template #title>
      Send Email
    </template>
    <template #content>
      <!-- Send Email node specific content here -->
      <div class="p-2 space-y-2">
        <UFormField label="To" name="to">
          <UInput :model-value="node.data.config.to" readonly class="w-full" />
        </UFormField>
        <UFormField label="Subject" name="subject">
          <UInput :model-value="node.data.config.subject" readonly class="w-full" />
        </UFormField>
        <UFormField label="Body" name="body">
          <UTextarea :model-value="node.data.config.body" readonly class="w-full" />
        </UFormField>
      </div>
    </template>
  </WorkflowNodeBase>
</template>
