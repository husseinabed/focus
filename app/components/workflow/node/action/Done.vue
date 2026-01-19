<script setup lang="ts">
import { doneNodeSchema } from "~~/shared/workflowNodeSchemas";

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
      schema: doneNodeSchema,
      label: data.label,
      runtime: data.runtime,
      execution: data.config,
      runtimePorts: doneNodeSchema.ports,
    }"
    :selected="selected"
  />
</template>
