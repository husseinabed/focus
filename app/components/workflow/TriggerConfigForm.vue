<script setup lang="ts">
import { computed } from 'vue';
import { ZodObject, ZodString, ZodEnum, ZodNumber, ZodBoolean, ZodOptional } from 'zod';
import { 
  manualTriggerSchema,
  leadAddedTriggerSchema,
  inboundReplyTriggerSchema,
  scheduledTriggerSchema
} from '~~/shared/workflowNodeSchemas';

const props = defineProps<{
  triggerType: 'manual' | 'lead_added' | 'inbound_reply' | 'scheduled';
  config: Record<string, any>;
}>();

const emit = defineEmits(['update:config']);

const internalConfig = computed({
  get: () => props.config,
  set: (value) => {
    emit('update:config', value);
  },
});

const triggerSchemas = {
  manual: manualTriggerSchema,
  lead_added: leadAddedTriggerSchema,
  inbound_reply: inboundReplyTriggerSchema,
  scheduled: scheduledTriggerSchema,
};

const currentSchema = computed(() => {
  return triggerSchemas[props.triggerType] || {};
});

const configFields: ComputedRef<Record<string, any>> = computed(() => {
  return currentSchema.value?.config || {};
});

const getNodeTranslation = (key: string) => {
  const { t } = useI18n();
  return t(key);
};

const getOptionsForEnum = (field: any) => {
  if (field.type === 'enum' && field.options) {
    return field.options.map((option: string) => ({
      value: option,
      label: getNodeTranslation(`workflow.nodes.trigger.${props.triggerType}.${field.label.split('.').pop()}.${option}`),
    }));
  }
  return [];
};

</script>

<template>
  <div class="space-y-4">
    <template v-for="(field, key) in configFields" :key="key">
      <UFormField
        :label="getNodeTranslation(field.label)"
        :name="`trigger_config.${String(key)}`"
        :required="field.required"
      >
        <UInput
          v-if="field.type === 'string'"
          v-model="internalConfig[key]"
          :placeholder="getNodeTranslation(field.placeholder)"
          class="w-full"
        />
        <USelect
          v-else-if="field.type === 'enum'"
          v-model="internalConfig[key]"
          :items="getOptionsForEnum(field)"
          class="w-full"
        />
        <UInputNumber
          v-else-if="field.type === 'number'"
          v-model="internalConfig[key]"
          :min="field.min"
          :max="field.max"
          class="w-full"
        />
        <UCheckbox
          v-else-if="field.type === 'boolean'"
          v-model="internalConfig[key]"
          :label="getNodeTranslation(field.label)"
        />
      </UFormField>
    </template>
  </div>
</template>
