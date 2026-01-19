<script setup lang="ts">

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'en',
  },
  variables: {
    type: Object as PropType<Record<string, { label: string; example: string }>>,
    default: () => ({}),
  },
  reservedVariables: {
    type: Array as PropType<string[]>,
    default: () => [
      'lead.first_name',
      'lead.full_name',
      'lead.company_name',
      'lead.phone',
      'lead.city',
      'lead.language',
      'workspace.name',
      'user.first_name',
    ],
  },
});

const emit = defineEmits(['update:modelValue']);

const internalValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal;
  }
);

watch(
  internalValue,
  (newVal) => {
    emit('update:modelValue', newVal);
  }
);

const charCount = computed(() => internalValue.value.length);

const dir = computed(() => {
  return ['he', 'ar'].includes(props.language) ? 'rtl' : 'ltr';
});

const highlightedContent = computed(() => {
  let content = internalValue.value;
  const allVariableKeys = new Set([...props.reservedVariables, ...Object.keys(props.variables)]);

  return content.replace(/{{(.*?)}}/g, (match, p1) => {
    const variableKey = p1.trim();
    if (allVariableKeys.has(variableKey)) {
      return `<span class="text-primary-500 dark:text-primary-400 font-semibold">${match}</span>`;
    } else {
      return `<span class="text-red-500 dark:text-red-400 font-semibold">${match}</span>`;
    }
  });
});

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const contentDivRef = ref<HTMLDivElement | null>(null);

// Synchronize scroll positions
const handleScroll = () => {
  if (textareaRef.value && contentDivRef.value) {
    contentDivRef.value.scrollTop = textareaRef.value.scrollTop;
  }
};

</script>

<template>
  <div class="relative">
    <UTextarea
      ref="textareaRef"
      v-model="internalValue"
      :rows="10"
      :dir="dir"
      class="w-full font-mono !bg-transparent z-10"
      autocomplete="off"
      spellcheck="false"
      autocapitalize="off"
      autocorrect="off"
      @scroll="handleScroll"
    />
    <div
      ref="contentDivRef"
      :dir="dir"
      class="absolute inset-0 p-2 pointer-events-none overflow-y-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200"
      v-html="highlightedContent"
    ></div>
  </div>
  <div class="text-sm text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
    <span>Characters: {{ charCount }}</span>
  </div>
</template>

<style scoped>
/* Hide scrollbar for the overlay div but keep functionality */
.pointer-events-none::-webkit-scrollbar {
  width: 0 !important;
  display: none;
}
.pointer-events-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>