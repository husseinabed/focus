<script setup lang="ts">
import { UFormField, UInput } from '#components'
import { scheduledTriggerSchema } from '~~/shared/workflowNodeSchemas'
import Base from '~/components/workflow/node/Base.vue'

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.cron_expression == null) {
    props.node.data.config.cron_expression = ''
  }
}
</script>

<template>
  <Base
    :node="node"
    :tone="scheduledTriggerSchema.ui.tone"
    :icon="scheduledTriggerSchema.icon"
  >
    <template #content>
      <UFormField
        :label="scheduledTriggerSchema.config.cron_expression.label"
        :help="scheduledTriggerSchema.config.cron_expression.hint"
        :placeholder="scheduledTriggerSchema.config.cron_expression.placeholder"
        name="cron_expression"
        class="w-full"
      >
        <UInput
          v-model="node.data.config.cron_expression"
          :placeholder="scheduledTriggerSchema.config.cron_expression.placeholder"
          class="w-full"
        />
      </UFormField>
    </template>
  </Base>
</template>
