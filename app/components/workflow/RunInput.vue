<template>
  <UFormField :label="label">
    <UTextarea
      v-model="inputValue"
      placeholder="{}"
      :rows="10"
      class="w-full"
      font="mono"
    />
  </UFormField>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useWorkflowEditor } from '~/composables/useWorkflowEditor'

const props = defineProps({
  bindTo: {
    type: String,
    required: true,
  },
})

const { getNodeProp, setNodeProp } = useWorkflowEditor()

const label = computed(() => {
  const parts = props.bindTo.split('.')
  return parts[parts.length - 1]
})

const initialValue = computed(() => {
  return getNodeProp(props.bindTo)
})

const inputValue = ref(JSON.stringify(initialValue.value, null, 2))

watch(inputValue, (newValue) => {
  try {
    const parsedValue = JSON.parse(newValue)
    setNodeProp(props.bindTo, parsedValue)
  } catch (e) {
    // Invalid JSON, do nothing for now or show an error
    console.error('Invalid JSON input:', e)
  }
})

watch(initialValue, (newValue) => {
  inputValue.value = JSON.stringify(newValue, null, 2)
}, { deep: true })
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>
