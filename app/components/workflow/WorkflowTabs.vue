<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  items: {
    type: Array<{ id: string; label: Record<string, string> }>,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const activeTab = ref(props.modelValue)

watch(activeTab, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newValue) => {
  if (newValue !== activeTab.value) {
    activeTab.value = newValue
  }
})
</script>

<template>
  <UTabs v-model="activeTab" variant="link" :items="items.map(item => ({
    value: item.id,
    label: t(item.label[locale.value] || item.label.en || item.id),
  }))">
    <template #item="{ item }">
      <slot :name="item.id" />
    </template>
  </UTabs>
</template>
