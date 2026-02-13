<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { reactive, watch, ref } from 'vue'

const props = defineProps<{
  modelValue: {
    name?: string
    description?: string
    offer?: string
    target_audience?: string
    languages?: string[]
    goal?: string
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
  submit: [data: typeof props.modelValue]
  error: [errors: any[]]
}>()

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  offer: z.string().min(10, 'Offer must be at least 10 characters'),
  target_audience: z.string().min(5, 'Target audience is required'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  goal: z.string().min(5, 'Goal is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: props.modelValue.name || '',
  description: props.modelValue.description || '',
  offer: props.modelValue.offer || '',
  target_audience: props.modelValue.target_audience || '',
  languages: props.modelValue.languages || [],
  goal: props.modelValue.goal || ''
})

const isDirty = ref(false)
const form = ref()

// Autosave hook (debounced)
let timeout: NodeJS.Timeout
const debouncedUpdate = () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('update:modelValue', { ...state })
    isDirty.value = false
  }, 1000)
}

watch(state, () => {
  isDirty.value = true
  debouncedUpdate()
}, { deep: true })

function onSubmit(event: FormSubmitEvent<Schema>) {
  emit('submit', event.data)
  isDirty.value = false
}

function onError(event: any) {
  emit('error', event.errors)
  
  // Focus first error
  if (event.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id)
    element?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const languages = ['English', 'Spanish', 'French', 'German', 'Hebrew', 'Arabic']
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
          Strategy Configuration
        </h3>
        <UBadge v-if="isDirty" color="warning" variant="subtle" size="xs">
          Unsaved changes
        </UBadge>
      </div>
    </template>

    <UForm
      ref="form"
      :schema="schema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
      @error="onError"
    >
      <!-- Error Summary Slot could go here -->

      <UFormField label="Strategy Name" name="name" required help="A unique name for this strategy">
        <UInput v-model="state.name" class="w-full" placeholder="e.g., Q1 Outreach Campaign" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" class="w-full" placeholder="Describe the strategy's purpose..." />
      </UFormField>

      <USeparator />

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <UFormField label="Target Audience" name="target_audience" required help="Who are you trying to reach?">
          <UInput v-model="state.target_audience" class="w-full" placeholder="e.g., CTOs of SaaS companies" />
        </UFormField>

        <UFormField label="Primary Goal" name="goal" required>
          <UInput v-model="state.goal" class="w-full" placeholder="e.g., Schedule 50 demos" />
        </UFormField>
      </div>

      <UFormField label="Core Offer" name="offer" required help="What value proposition are you offering?">
        <UTextarea v-model="state.offer" :rows="4" class="w-full" placeholder="e.g., Free consultation for..." />
      </UFormField>

      <UFormField label="Languages" name="languages" required>
        <USelectMenu v-model="state.languages" :items="languages" multiple placeholder="Select languages" class="w-full" />
      </UFormField>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton type="submit" label="Save Strategy" color="primary" icon="i-lucide-save" />
        </div>
      </template>
    </UForm>
  </UCard>
</template>
