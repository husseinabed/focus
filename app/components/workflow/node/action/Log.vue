<script setup lang="ts">
import { loggingNodeSchema } from "~~/shared/workflowNodeSchemas";

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
console.log(loggingNodeSchema);

</script>

<template>
  <WorkflowNodeBase
    :data="{
      schema: loggingNodeSchema,
      label: data.label,
      execution: data.config,
      runtimePorts: loggingNodeSchema.ports,
    }"
    :selected="selected"
  />
</template>
