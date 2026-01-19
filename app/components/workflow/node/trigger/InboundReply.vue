<script setup lang="ts">
import { inboundReplyTriggerSchema } from '~~/shared/workflowNodeSchemas'
import { UFormField, UInput } from '#components'
import Base from '~/components/workflow/node/Base.vue'

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.inbox_id == null) {
    props.node.data.config.inbox_id = ''
  }
  if (props.node.data.config.keywords == null) {
    props.node.data.config.keywords = ''
  }
}
</script>

<template>
  <Base
    :node="node"
    :tone="inboundReplyTriggerSchema.ui.tone"
    :icon="inboundReplyTriggerSchema.icon"
  >
    <template #content>
      <UFormField
        :label="inboundReplyTriggerSchema.config.inbox_id.label"
        :placeholder="inboundReplyTriggerSchema.config.inbox_id.placeholder"
        :description="inboundReplyTriggerSchema.config.inbox_id.description"
      >
        <UInput
          v-model="props.node.data.config.inbox_id"
          class="w-full"
          :placeholder="inboundReplyTriggerSchema.config.inbox_id.placeholder"
        />
      </UFormField>

      <UFormField
        :label="inboundReplyTriggerSchema.config.keywords.label"
        :placeholder="inboundReplyTriggerSchema.config.keywords.placeholder"
        :description="inboundReplyTriggerSchema.config.keywords.description"
      >
        <UInput
          v-model="props.node.data.config.keywords"
          class="w-full"
          :placeholder="inboundReplyTriggerSchema.config.keywords.placeholder"
        />
      </UFormField>
    </template>
  </Base>
</template>
