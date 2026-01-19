<script setup lang="ts">

interface Variable {
  key: string;
  label: string;
  example: string;
}

const props = defineProps({
  modelValue: {
    type: Object as PropType<Record<string, { label: string; example: string }>>,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue"]);

const variables = ref<Variable[]>([]);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    variables.value = Object.entries(newVal).map(([key, value]) => ({
      key,
      label: value.label,
      example: value.example,
    }));
  },
  { immediate: true, deep: true }
);

// Emit changes to parent
watch(
  variables,
  (newVars) => {
    const newModelValue: Record<string, { label: string; example: string }> = {};
    newVars.forEach((v) => {
      if (v.key) {
        newModelValue[v.key] = { label: v.label, example: v.example };
      }
    });
    emit("update:modelValue", newModelValue);
  },
  { deep: true }
);

const addVariable = () => {
  variables.value.push({ key: '', label: '', example: '' });
};

const removeVariable = (index: number) => {
  variables.value.splice(index, 1);
};
</script>

<template>
  <div class="space-y-4">
    <div v-for="(variable, index) in variables" :key="index" class="flex items-center space-x-4">
      <UFormField label="Key" class="flex-1">
        <UInput v-model="variable.key" placeholder="e.g., offer" class="w-full" />
      </UFormField>
      <UFormField label="Label" class="flex-1">
        <UInput v-model="variable.label" placeholder="e.g., Main Offer" class="w-full" />
      </UFormField>
      <UFormField label="Example" class="flex-1">
        <UInput v-model="variable.example" placeholder="e.g., Free website audit" class="w-full" />
      </UFormField>
      <UButton icon="i-heroicons-minus-circle" color="red" variant="ghost" @click="removeVariable(index)" />
    </div>
    <UButton icon="i-heroicons-plus-circle" color="primary" variant="soft" @click="addVariable">
      Add Variable
    </UButton>
    <USeparator v-if="variables.length > 0" />
  </div>
</template>
