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
    runtime?: any;
  };

  selected?: boolean;
}>();
</script>

<template>
 
  <WorkflowNodeBase
  :data="{
    schema: manualTriggerSchema,
    label: data.label,
    runtime: data.runtime,
    execution: data.config,
    runtimePorts: manualTriggerSchema.ports,
  }"
   :selected="selected"
   />
</template>
