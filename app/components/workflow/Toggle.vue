<script setup lang="ts">
const props = defineProps<{
  label: string
  modelValue: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', payload: boolean): void
}>()
 
const modelValue = computed({
  set (val: boolean) {
    emit('update:modelValue', val)
  },
  get () {
    return props.modelValue
  }
})
</script>

<template>
  <UFormField :label="props.label">
    <USwitch v-model="modelValue" />
  </UFormField>
</template>