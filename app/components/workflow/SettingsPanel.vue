<template>
  <div v-if="isVisible">
    <UFormField
      v-for="field in fields"
      :key="field.key"
      :label="field.label.en"
      class="mb-4"
    >
      <UInput
        v-if="field.type === 'UInput'"
        v-model="localWorkflow[field.key]"
        class="w-full"
      />
      <UTextarea
        v-else-if="field.type === 'UTextarea'"
        v-model="localWorkflow[field.key]"
        :rows="field.rows || 3"
        class="w-full"
      />
      <USelectMenu
        v-else-if="field.type === 'USelectMenu'"
        v-model="localWorkflow[field.key]"
        :items="field.options"
        class="w-full"
      />
    </UFormField>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import { useWorkflowStore } from '~/stores/workflow';

const props = defineProps({
  visibleWhen: { type: Object, default: () => ({ expr: 'true' }) },
  fields: { type: Array, default: () => [] },
});

const workflowStore = useWorkflowStore();
const localWorkflow = ref({ ...workflowStore.workflow });

// Watch for changes in the store and update localWorkflow
watch(() => workflowStore.workflow, (newVal) => {
  localWorkflow.value = { ...newVal };
}, { deep: true });

// Watch for changes in localWorkflow and update the store
watch(localWorkflow, (newVal) => {
  workflowStore.updateWorkflow(newVal);
}, { deep: true });

const isVisible = computed(() => {
  try {
    const state = {
      ui: {
        active_tab: workflowStore.ui.active_tab
      },
      workflow: workflowStore.workflow
    };
    const evaluate = new Function('state', `return ${props.visibleWhen.expr}`);
    return evaluate(state);
  } catch (e) {
    console.error('Error evaluating visibleWhen expression:', e);
    return false;
  }
});
</script>
