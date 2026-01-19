<script setup lang="ts">
const props = defineProps({
  sourceFrom: {
    type: String,
    default: 'state.run.output',
  },
  // TODO: Add the actual output data prop based on `sourceFrom`
  outputData: {
    type: [Object, Array, String, Number, Boolean, null],
    default: null,
  },
});
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Run Output</h3>
      </div>
    </template>
    <div class="prose dark:prose-invert max-w-none">
      <pre v-if="outputData">{{ JSON.stringify(outputData, null, 2) }}</pre>
      <p v-else>No output available.</p>
    </div>
  </UCard>
</template>

<style scoped></style>
