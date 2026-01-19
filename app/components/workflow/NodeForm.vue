<script setup lang="ts">
import { computed, type PropType } from 'vue'

interface NodeSchemaProperty {
  type: string
  title?: string
  description?: string
  required?: boolean
  format?: string
  enum?: string[]
}

interface NodeSchema {
  type: string
  config: { [key: string]: NodeSchemaProperty }
}

const props = defineProps({
  nodeFrom: {
    type: Object,
    required: true,
  },
  schemaFrom: {
    type: Object as PropType<NodeSchema>,
    required: true,
  },
  features: {
    type: Object,
    default: () => ({
      show_ports: false,
      show_required_badges: false,
      show_validation_inline: false,
    }),
  },
})

const nodeData = computed(() => props.nodeFrom.data || {})

const formFields = computed(() => {
console.log(props.schemaFrom);

  if (!props.schemaFrom || !props.schemaFrom.config) {
    return []
  }

  const fields = Object.entries(props.schemaFrom.config).map(([key, schema]) => ({
    key,
    label: schema.label || key,
    type: schema.type,
    description:  schema.description ,
    required: schema.required,
    format: schema.format,
    enum: schema.enum,
  }))

  return fields
})

console.log(

 formFields.value

);
const getFieldValue = (key: string) => {
  return nodeData.value[key]
}

const setFieldValue = (key: string, value: any) => {
  props.nodeFrom.data = { ...props.nodeFrom.data, [key]: value }
}
</script>

<template>
  <div class="space-y-4">
    <template v-for="field in formFields" :key="field.key">
      <UFormField
        :label="field.type === 'boolean' ? undefined : (field.label ? $t(field.label) : undefined)"
        :help="field.description ? $t(field.description) : undefined"
        :required="field.required && features.show_required_badges"
        :error="
          features.show_validation_inline ? 'Validation error placeholder' : undefined
        "
        class="w-full"
      >
       
        <UTextarea
          v-if="field.type === 'string' && field.format === 'textarea'"
          :model-value="getFieldValue(field.key)"
          @update:model-value="setFieldValue(field.key, $event)"
          class="w-full"
        />
        <USelect
          v-else-if="field.type === 'string' && field.enum"
          :model-value="getFieldValue(field.key)"
          @update:model-value="setFieldValue(field.key, $event)"
          :items="field.enum"
          class="w-full"
        />
        <UCheckbox
          v-else-if="field.type === 'boolean'"
          :model-value="getFieldValue(field.key)"
          @update:model-value="setFieldValue(field.key, $event)"
          :label="$t(field.label)"
        />
        <UInput
          v-else-if="field.type === 'number' || field.type === 'integer'"
          type="number"
          :model-value="getFieldValue(field.key)"
          @update:model-value="setFieldValue(field.key, $event)"
          class="w-full"
        />
         <UInput
          v-else-if="field.type === 'string' && !field.format"
          :model-value="getFieldValue(field.key)"
          @update:model-value="setFieldValue(field.key, $event)"
          class="w-full"
        />
        <p v-else>Unsupported field type: {{ field.type }}</p>
      </UFormField>
    </template>
  </div>
</template>
