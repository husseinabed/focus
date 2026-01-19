<script setup lang="ts">
import { leadAddedTriggerSchema } from '~~/shared/workflowNodeSchemas'
import Base from '~/components/workflow/node/Base.vue'
import { UFormField, UInput, USelect } from '#components'

const props = defineProps<{ node: any }>()

if (props.node?.data) {
  if (!props.node.data.config) {
    props.node.data.config = {}
  }
  if (props.node.data.config.source == null) {
    props.node.data.config.source =
      leadAddedTriggerSchema.config.source.default ??
      leadAddedTriggerSchema.config.source.options[0]
  }
  if (props.node.data.config.min_priority == null) {
    props.node.data.config.min_priority =
      leadAddedTriggerSchema.config.min_priority.default ??
      leadAddedTriggerSchema.config.min_priority.min ??
      1
  }
}

const sourceOptions = leadAddedTriggerSchema.config.source.options.map((option: string) => ({
  label: option.charAt(0).toUpperCase() + option.slice(1),
  value: option,
}))
</script>

<template>
  <Base
    :data="node.data"
  >
    <template #content>
      <UFormField
        :label="$t(leadAddedTriggerSchema.config.source.label)"
        :error="node.data.errors?.source"
        :message="node.data.errors?.source"
      >
        <USelect
          v-model="node.data.config.source"
          :items="sourceOptions"
          :placeholder="$t(leadAddedTriggerSchema.config.source.label)"
          color="neutral"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="$t(leadAddedTriggerSchema.config.min_priority.label)"
        :error="node.data.errors?.min_priority"
        :message="node.data.errors?.min_priority"
      >
        <UInput
          v-model.number="node.data.config.min_priority"
          type="number"
          :min="leadAddedTriggerSchema.config.min_priority.min"
          :max="leadAddedTriggerSchema.config.min_priority.max"
          :placeholder="$t(leadAddedTriggerSchema.config.min_priority.label)"
          color="neutral"
          class="w-full"
        />
      </UFormField>
    </template>
  </Base>
</template>
