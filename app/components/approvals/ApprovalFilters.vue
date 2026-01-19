<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  states: {
    type: Array,
    default: () => [],
  },
  languages: {
    type: Array,
    default: () => [],
  },
  users: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'apply']);

const filters = ref(props.modelValue);

watch(
  filters,
  (newVal) => {
    emit('update:modelValue', newVal);
  },
  { deep: true },
);

const { locale } = useI18n();

const isRtl = computed(() => locale.value === 'ar');

const stateOptions = computed(() => [
  { label: 'All', value: 'all' },
  ...props.states.map((state) => ({
    label: state.label,
    value: state.value,
  })),
]);

const languageOptions = computed(() => [
  { label: 'All', value: 'all' },
  ...props.languages.map((lang) => ({
    label: lang.label,
    value: lang.value,
  })),
]);

const createdByOptions = computed(() => [
  { label: 'All', value: 'all' },
  ...props.users.map((user) => ({
    label: user.label,
    value: user.value,
  })),
]);
</script>

<template>
  <UContainer :dir="isRtl ? 'rtl' : 'ltr'" class="flex flex-col md:flex-row items-center gap-4 py-4">
    <UInput
      v-model="filters.search"
      placeholder="Search approvals..."
      icon="i-heroicons-magnifying-glass"
      class="w-full"
    />

    <UFieldGroup class="w-full md:w-auto">
      <UButton
        v-for="state in stateOptions"
        :key="state.value"
        :color="filters.state === state.value ? 'primary' : 'neutral'"
        @click="filters.state = state.value"
      >
        {{ state.label }}
      </UButton>
    </UFieldGroup>

    <USelectMenu
      v-model="filters.language"
      :items="languageOptions"
      placeholder="Filter by Language"
      value-attribute="value"
      option-attribute="label"
      class="w-full"
    />

    <USelectMenu
      v-model="filters.createdBy"
      :items="createdByOptions"
      placeholder="Filter by Created By"
      value-attribute="value"
      option-attribute="label"
      class="w-full"
    />
  </UContainer>
</template>
