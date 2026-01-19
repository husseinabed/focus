<script setup lang="ts">
import { manualTriggerSchema } from "~~/shared/workflowNodeSchemas";

const props = defineProps<{
  id: string;
  type: string;
  events: any;
  data: {
    label: string;
    config: {
      trigger_type: string;
    };
  };

  selected?: boolean;
}>();
</script>

<template>
 
  <WorkflowNodeBase
  :data="{
    schema: manualTriggerSchema,
    label: data.label,
    execution: data.config,
    runtimePorts: manualTriggerSchema.ports,
  }"
   :selected="selected"
   />
</template>
