<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Meeting } from '~/types/meetings'
import DatePicker from '~/components/forms/DatePicker.vue'
definePageMeta({
  layout: 'app'
})
const route = useRoute()
const router = useRouter()

const leadIdFromQuery = route.query.leadId as string | undefined

const meetingTypes = [
  { label: 'Call', value: 'call' },
  { label: 'Meeting', value: 'meeting' },
  { label: 'Demo', value: 'demo' },
]

const meetingProviders = [
  { label: 'Google Meet', value: 'google-meet' },
  { label: 'Zoom', value: 'zoom' },
  { label: 'Microsoft Teams', value: 'microsoft-teams' },
  { label: 'Other', value: 'other' },
]

const durationOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `${(i + 1) * 15} minutes`,
  value: (i + 1) * 15,
}))

const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Asia/Jerusalem', value: 'Asia/Jerusalem' },
]

const schema = z.object({
  lead_id: z.string().uuid('Invalid lead ID').optional(),
  type: z.enum(['call', 'meeting', 'demo'], { message: 'Invalid meeting type' }),
  provider: z.string().min(1, 'Provider is required'),
  title: z.string().min(1, 'Title is required'),
  start_time: z.date({
    required_error: "A start date and time is required.",
    invalid_type_error: "A start date and time is required.",
  }),
  duration_minutes: z.number().min(1, 'Duration is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  meeting_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  lead_id: leadIdFromQuery,
  type: 'meeting',
  provider: 'google-meet',
  title: '',
  start_time: new Date(),
  duration_minutes: 30,
  timezone: 'Asia/Jerusalem',
  meeting_url: '',
  description: '',
})

async function onSubmit (event: FormSubmitEvent<Schema>) {
  try {
    const newMeeting = await $fetch('/api/meetings', {
      method: 'POST',
      body: event.data,
    })
    router.push('/app/meetings')
  } catch (error) {
    console.error('Error creating meeting:', error)
  }
}
</script>

<template>
  <UContainer>
    <USeparator class="mb-4" />
    <h1 class="text-2xl font-bold mb-4">Create New Meeting</h1>
    <USeparator class="mb-4" />

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Lead ID" name="lead_id" v-if="state.lead_id">
        <UInput v-model="state.lead_id" disabled class="w-full" />
      </UFormField>

      <UFormField label="Type" name="type" required>
        <USelect v-model="state.type" :items="meetingTypes" value-attribute="value" option-attribute="label" class="w-full" />
      </UFormField>

      <UFormField label="Provider" name="provider" required>
        <USelect v-model="state.provider" :items="meetingProviders" value-attribute="value" option-attribute="label" class="w-full" />
      </UFormField>

      <UFormField label="Title" name="title" required>
        <UInput v-model="state.title" class="w-full" />
      </UFormField>

      <UFormField label="Start Time" name="start_time" required>
        <DatePicker v-model="state.start_time" class="w-full" />
      </UFormField>

      <UFormField label="Duration" name="duration_minutes" required>
        <USelect v-model="state.duration_minutes" :items="durationOptions" value-attribute="value" option-attribute="label" class="w-full" />
      </UFormField>

      <UFormField label="Timezone" name="timezone" required>
        <USelect v-model="state.timezone" :items="timezoneOptions" value-attribute="value" option-attribute="label" class="w-full" />
      </UFormField>

      <UFormField label="Meeting URL" name="meeting_url">
        <UInput v-model="state.meeting_url" type="url" class="w-full" />
      </UFormField>

      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" class="w-full" />
      </UFormField>

      <UButton type="submit">Create Meeting</UButton>
    </UForm>
  </UContainer>
</template>
