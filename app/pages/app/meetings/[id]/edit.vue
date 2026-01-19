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
const toast = useToast()

const meetingId = route.params.id as string

const { data: meeting, pending } = useAsyncData<Meeting>(`meetings-${meetingId}`, () =>
  $fetch(`/api/meetings/${meetingId}`)
)

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
  meeting_url: z.string().url('Invalid URL').optional().or(z.literal('')) as z.ZodString, // Type assertion for empty string
  description: z.string().optional(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  lead_id: undefined,
  type: 'meeting',
  provider: 'google-meet',
  title: '',
  start_time: new Date(),
  duration_minutes: 30,
  timezone: 'Asia/Jerusalem',
  meeting_url: '',
  description: '',
})

watch(meeting, (newMeeting) => {
  if (newMeeting) {
    state.lead_id = newMeeting.lead_id || undefined
    state.type = newMeeting.type
    state.provider = newMeeting.provider
    state.title = newMeeting.title
    state.start_time = new Date(newMeeting.start_time)
    state.duration_minutes = newMeeting.duration_minutes
    state.timezone = newMeeting.timezone
    state.meeting_url = newMeeting.meeting_url || ''
    state.description = newMeeting.description || ''
  }
}, { immediate: true })

async function onSubmit (event: FormSubmitEvent<Schema>) {
  try {
    await $fetch(`/api/meetings/${meetingId}`, {
      method: 'PUT',
      body: event.data,
    })
    toast.add({ title: 'Meeting updated successfully!', color: 'green' })
    router.push(`/app/meetings/${meetingId}`)
  } catch (error) {
    toast.add({ title: 'Error updating meeting', description: (error as Error).message, color: 'red' })
    console.error('Error updating meeting:', error)
  }
}
</script>

<template>
  <UContainer>
    <USeparator class="mb-4" />
    <h1 class="text-2xl font-bold mb-4">Edit Meeting</h1>
    <USeparator class="mb-4" />

    <div v-if="pending">Loading meeting...</div>
    <div v-else-if="!meeting">Meeting not found.</div>
    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
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

      <UButton type="submit">Update Meeting</UButton>
    </UForm>
  </UContainer>
</template>
