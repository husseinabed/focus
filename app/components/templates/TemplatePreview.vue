<script setup lang="ts">

const props = defineProps({
  body: {
    type: String,
    required: true,
  },
  variables: {
    type: Object as PropType<Record<string, { label: string; example: string }>>,
    default: () => ({}),
  },
  mockData: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  language: {
    type: String,
    default: 'en',
  },
});

const renderedContent = computed(() => {
  let content = props.body;

  // Combine mockData and variables for rendering
  const allVariables = { ...props.mockData };
  for (const key in props.variables) {
    if (Object.prototype.hasOwnProperty.call(props.variables, key)) {
      // Prioritize mockData if a key exists in both
      if (!allVariables[key]) {
        allVariables[key] = props.variables[key].example;
      }
    }
  }

  // Replace {{variable}} placeholders
  content = content.replace(/{{(.*?)}}/g, (match, p1) => {
    const variableKey = p1.trim();
    return allVariables[variableKey] || match; // Keep original if variable not found
  });

  return content;
});

const dir = computed(() => {
  return ['he', 'ar'].includes(props.language) ? 'rtl' : 'ltr';
});
</script>

<template>
  <div :dir="dir" class="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
    <p class="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{{ renderedContent }}</p>
  </div>
</template>
