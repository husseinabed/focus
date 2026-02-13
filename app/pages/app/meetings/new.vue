<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Meeting } from '~/types/meetings'
import DatePicker from '~/components/forms/DatePicker.vue'
import { ref, computed, watch, reactive } from 'vue' // Import ref, computed, watch, and reactive
import type { Form } from '#ui/types' // Import Form type
import { useI18n } from 'vue-i18n'

const supportedLanguagesOptions = [
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Hebrew', value: 'he' },
];

const dropdownItems = [
  [{
    label: 'Meeting templates',
    slot: 'template'
  }], [{
    label: 'No Templates Available',
    disabled: true
  }]
]

const createMeetingDropdownItems = [
  [{
    label: 'Create + send confirmation',
    click: () => { console.log('Create + send confirmation') } // Placeholder action
  }],
  [{
    label: 'Create without sending',
    click: () => { console.log('Create without sending') } // Placeholder action
  }],
  [{
    label: 'Create + open invite preview',
    click: () => { console.log('Create + open invite preview') } // Placeholder action
  }]
]

definePageMeta({
  layout: 'app'
})

const route = useRoute()
const router = useRouter()
const { locale } = useI18n() // Use i18n

const isRTL = computed(() => locale.value === 'ar' || locale.value === 'he')

const leadIdFromQuery = route.query.leadId as string | undefined

const meetingTypes = [
  { label: 'Call', value: 'call' },
  { label: 'Video', value: 'video' },
  { label: 'In-person', value: 'in-person' },
]

const videoProviders = [
  { label: 'Google Meet', value: 'google-meet' },
  { label: 'Zoom', value: 'zoom' },
  { label: 'Custom link', value: 'custom' },
]

const durationOptions = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
  { label: 'Custom', value: 'custom' },
]

const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Asia/Jerusalem', value: 'Asia/Jerusalem' },
]

const outcomeGoalOptions = [
  { label: 'Intro', value: 'Intro' },
  { label: 'Demo', value: 'Demo' },
  { label: 'Proposal', value: 'Proposal' },
  { label: 'Support', value: 'Support' },
]

const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Team', value: 'team' },
]

const schema = z.object({
  lead_id: z.string().uuid('Invalid lead ID').optional(),
  linkedLeadId: z.string().uuid('Invalid lead ID').optional(),
  type: z.enum(meetingTypes.map(t => t.value) as [string, ...string[]]).min(1, 'Meeting type is required'),
  title: z.string().min(1, 'Title is required'),
  start_time: z.date({ message: 'A start date and time is required.' }),
  duration_minutes: z.union([z.number().min(1, 'Duration is required'), z.literal('custom')], { message: 'Duration is required' }),
  duration_custom: z.number().min(1, 'Custom duration is required').optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  host: z.string().min(1, 'Host is required'),
  invitee: z.string().min(1, 'Invitee is required'),
  additional_attendees: z.string().optional(),
  video_provider: z.enum(videoProviders.map(p => p.value) as [string, ...string[]]).optional(),
  custom_video_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  in_person_address: z.string().optional(),
  in_person_notes: z.string().optional(),
  call_phone: z.string().optional(),
  call_use_lead_phone: z.boolean().default(false),
  description: z.string().optional(), // For agenda/notes
  visibility: z.enum(visibilityOptions.map(v => v.value) as [string, ...string[]]),
  sendConfirmation: z.boolean().default(true),
  confirmationChannels: z.array(z.enum(['email', 'whatsapp', 'sms'])).default(['email']),
  reminderSchedule: z.array(z.enum(['24h', '2h', '15m', 'custom'])).default([]),
  customReminderTime: z.number().min(1, 'Custom reminder time is required').optional(),
  messagePreview: z.string().optional(),
  messageLanguageOverride: z.string().optional(),
  aiAgenda: z.string().optional(),
  tags: z.string().optional(),
  outcomeGoal: z.enum(['Intro', 'Demo', 'Proposal', 'Support']).optional(),
}).superRefine((data, ctx) => {
  // Conditional validation for meeting type
  if (data.type === 'video') {
    if (!data.video_provider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Video provider is required for video meetings',
        path: ['video_provider'],
      });
    }
    if (data.video_provider === 'custom' && !data.custom_video_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom video URL is required for custom video providers',
        path: ['custom_video_url'],
      });
    }
  } else if (data.type === 'in-person') {
    if (!data.in_person_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required for in-person meetings',
        path: ['in_person_address'],
      });
    }
  } else if (data.type === 'call') {
    if (!data.call_use_lead_phone && !data.call_phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number is required for call meetings, or use lead phone',
        path: ['call_phone'],
      });
    }
  }
});

type Schema = z.output<typeof schema>

const form = ref<Form<Schema>>() // Add ref for the form

const state = reactive<Schema>({
  lead_id: leadIdFromQuery,
  linkedLeadId: leadIdFromQuery,
  type: 'call',
  title: '',
  start_time: new Date(),
  duration_minutes: 30,
  duration_custom: undefined,
  timezone: 'Asia/Jerusalem',
  host: 'Current User',
  invitee: '',
  additional_attendees: '',
  video_provider: undefined,
  custom_video_url: '',
  in_person_address: '',
  in_person_notes: '',
  call_phone: '',
  call_use_lead_phone: false,
  description: '',
  visibility: 'private',
  sendConfirmation: true,
  confirmationChannels: ['email'],
  reminderSchedule: [],
  customReminderTime: undefined,
  aiAgenda: "- Item 1\n- Item 2",
  tags: "",
  outcomeGoal: undefined,
  messageLanguageOverride: undefined, // Default to undefined
})

const startDate = computed({
  get: () => state.start_time,
  set: (value: Date) => {
    // Ensure state.start_time is a Date object before setting
    if (!state.start_time) {
      state.start_time = new Date();
    }
    state.start_time.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
  },
});

const startTime = computed({
  get: () => {
    const date = state.start_time;
    return date ? date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '';
  },
  set: (value: string) => {
    if (state.start_time) {
      const [hours, minutes] = value.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        state.start_time.setHours(hours, minutes);
      }
    }
  },
});

const endTimePreview = computed(() => {
  const startTimeDate = new Date(state.start_time);
  let duration = state.duration_minutes === 'custom' ? (state.duration_custom || 0) : state.duration_minutes;
  if (typeof duration !== 'number') {
    duration = 0;
  }
  startTimeDate.setMinutes(startTimeDate.getMinutes() + duration);
  return `Ends at ${startTimeDate.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;
});

// Placeholder for linkedLead. In a real application, this would be fetched based on state.linkedLeadId
const linkedLead = ref<{ language?: string } | null>(null);
const hasWhatsAppIntegration = ref(false);

// Watch for changes in linkedLeadId to auto-fill fields
watch(() => state.linkedLeadId, (newLeadId) => {
  if (newLeadId) {
    // Mock lead data for demonstration
    const mockLead = {
      company_name: 'Acme Corp',
      phoneNumber: '+1234567890',
      preferredLanguage: 'he',
    };
    
    state.title = `Intro call — ${mockLead.company_name}`;
    if (state.type === 'call') {
      state.call_phone = mockLead.phoneNumber;
    }
    state.messageLanguageOverride = mockLead.preferredLanguage;
  } else {
    // Optionally clear fields if no lead is selected
    state.title = '';
    state.call_phone = '';
    state.messageLanguageOverride = undefined;
  }
}, { immediate: true });

const messagePreview = computed(() => {
  const supportedLanguages = ['en', 'ar', 'he'];
  const getValidLanguage = (lang: string | undefined | null) => {
    if (lang && supportedLanguages.includes(lang)) {
      return lang;
    }
    return undefined;
  };
  // Determine the language for the message preview
  const previewLanguage = state.messageLanguageOverride ||
                          getValidLanguage(linkedLead.value?.language) ||
                          getValidLanguage(locale.value) ||
                          'en'; // Default to 'en' if all else fails

  const firstName = state.invitee || '{first_name}';
  const date = state.start_time ? new Date(state.start_time).toLocaleDateString(previewLanguage) : '{date}';
  const time = state.start_time ? new Date(state.start_time).toLocaleTimeString(previewLanguage, { hour: '2-digit', minute: '2-digit' }) : '{time}';
  const type = state.type || '{type}';
  const link = '{link}'; // Placeholder for the actual meeting link

  // Use i18n.t for translation with the determined language
  const { t } = useI18n();
  return t('meeting.message_preview', {
    firstName,
    type: t(`meeting.types.${type}`, { locale: previewLanguage }),
    date,
    time,
    link
  }, { locale: previewLanguage });
});

// Watch for changes in meeting type to reset conditional fields
watch(() => state.type, (newType) => {
  if (newType !== 'video') {
    state.video_provider = undefined
    state.custom_video_url = ''
  }
  if (newType !== 'in-person') {
    state.in_person_address = ''
    state.in_person_notes = ''
  }
  if (newType !== 'call') {
    state.call_phone = ''
    state.call_use_lead_phone = false
  }
})

// Watch for changes in duration_minutes to handle custom duration
watch(() => state.duration_minutes, (newDuration) => {
  if (newDuration !== 'custom') {
    state.duration_custom = undefined
  }
})

// Watch for changes in reminderSchedule to handle custom reminder time
watch(() => state.reminderSchedule, (newSchedule) => {
  if (!newSchedule.includes('custom')) {
    state.customReminderTime = undefined;
  }
});


function toggleChannel(channel: 'email' | 'whatsapp' | 'sms') {
  const index = state.confirmationChannels.indexOf(channel);
  if (index === -1) {
    state.confirmationChannels.push(channel);
  } else {
    state.confirmationChannels.splice(index, 1);
  }
}

function toggleReminder(reminder: '24h' | '2h' | '15m' | 'custom') {
  const index = state.reminderSchedule.indexOf(reminder);
  if (index === -1) {
    state.reminderSchedule.push(reminder);
    if (reminder === 'custom' && state.customReminderTime === undefined) {
      state.customReminderTime = 30; // Default to 30 minutes for custom
    }
  } else {
    state.reminderSchedule.splice(index, 1);
  }
}

async function onSubmit (event: FormSubmitEvent<Schema>) {
  try {
    // Adjust duration_minutes if custom is selected
    const finalDuration = state.duration_minutes === 'custom' ? state.duration_custom : state.duration_minutes;

    if (finalDuration === undefined) {
      throw new Error('Duration is required. Please select a duration or provide a custom one.');
    }

    const payload = {
      ...event.data,
      duration_minutes: finalDuration,
      // Map conditional fields based on type
      meeting_url: state.type === 'video' && state.video_provider === 'custom' ? state.custom_video_url : '',
      address: state.type === 'in-person' ? state.in_person_address : '',
      phone: state.type === 'call' ? state.call_phone : '',
      notes: state.description, // Re-purpose description for agenda/notes
      send_confirmation: state.sendConfirmation,
      confirmation_channels: state.confirmationChannels,
      reminder_schedule: state.reminderSchedule,
      custom_reminder_time: state.customReminderTime,
      linked_lead_id: state.linkedLeadId, // Add linkedLeadId to payload
      tags: state.tags,
      outcome_goal: state.outcomeGoal,
    }

    const newMeeting = await $fetch('/api/meetings', {
      method: 'POST',
      body: payload,
    })
    router.push('/app/meetings')
  } catch (error) {
    console.error('Error creating meeting:', error)
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="New meeting"
      description="Schedule a call and send confirmation"
    >
      <template #leading>
        <UButton
          icon="i-heroicons-arrow-left-20-solid"
          color="neutral"
          variant="ghost"
          to="/app/meetings"
        />
      </template>

      <template #actions>
        <UDropdownMenu :items="dropdownItems">
          <UButton icon="i-heroicons-wrench-screwdriver" color="neutral" label="Template" trailing-icon="i-heroicons-chevron-down-20-solid" />
        </UDropdownMenu>
      </template>
    </UPageHeader>

    <div v-if="form?.errors.length" class="p-4 text-red-500 bg-red-100 rounded-md mt-4">
      Fix {{ form.errors.length }} fields to proceed.
    </div>

    <UPageGrid>
      <UPageBody>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Meeting Details</h3>
          </template>
          <UForm ref="form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
            <!-- Meeting Title -->
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Meeting Title" name="title" required>
              <UInput v-model="state.title" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <!-- Type Segmented Control -->
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Type" name="type" required>
              <UFieldGroup class="w-full" orientation="horizontal">
                <UButton
                  v-for="typeOption in meetingTypes"
                  :key="typeOption.value"
                  :label="typeOption.label"
                  :variant="state.type === typeOption.value ? 'solid' : 'outline'"
                  color="neutral"
                  @click="state.type = typeOption.value"
                  class="flex-1"
                />
              </UFieldGroup>
            </UFormField>

            <!-- Date & Time -->
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Date" name="start_time" required>
              <DatePicker v-model="state.start_time" :locale="locale.value" class="w-full" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Start Time" name="start_time" required>
              <UInput v-model="startTime" type="time" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Duration" name="duration_minutes" required>
              <USelect v-model="state.duration_minutes" :items="durationOptions" value-attribute="value" option-attribute="label" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ endTimePreview }}</p>

            <UFormField
              v-if="state.duration_minutes === 'custom'"
              :dir="isRTL ? 'rtl' : 'ltr'"
              label="Custom Duration (minutes)"
              name="duration_custom"
              required
            >
              <UInput v-model.number="state.duration_custom" type="number" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Timezone" name="timezone" required>
              <USelect v-model="state.timezone" :items="timezoneOptions" value-attribute="value" option-attribute="label" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <!-- Participants -->
            <USeparator />
            <h4 class="text-md font-semibold">Participants</h4>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Host" name="host" required>
              <UInput v-model="state.host" disabled class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Invitee" name="invitee" required>
              <UInput v-model="state.invitee" placeholder="Search for a lead or contact" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Additional Attendees" name="additional_attendees">
              <UInput v-model="state.additional_attendees" placeholder="emails, comma separated" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <!-- Location (Conditional Fields) -->
            <USeparator />
            <h4 class="text-md font-semibold">Location</h4>

            <div v-if="state.type === 'video'">
              <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Video Provider" name="video_provider" required>
                <USelect v-model="state.video_provider" :items="videoProviders" value-attribute="value" option-attribute="label" class="w-full" :input-class="{'!text-right': isRTL}" />
              </UFormField>

              <UFormField
                v-if="state.video_provider === 'custom'"
                :dir="isRTL ? 'rtl' : 'ltr'"
                label="Custom Video URL"
                name="custom_video_url"
                required
              >
                <UInput v-model="state.custom_video_url" type="url" class="w-full" :input-class="{'!text-right': isRTL}" />
              </UFormField>
            </div>

            <div v-else-if="state.type === 'in-person'">
              <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Address" name="in_person_address" required>
                <UInput v-model="state.in_person_address" class="w-full" :input-class="{'!text-right': isRTL}" />
              </UFormField>

              <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Notes" name="in_person_notes">
                <UTextarea v-model="state.in_person_notes" class="w-full" :input-class="{'!text-right': isRTL}" />
              </UFormField>
            </div>

            <div v-else-if="state.type === 'call'">
              <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Phone" name="call_phone" required>
                <UInput v-model="state.call_phone" type="tel" class="w-full" :input-class="{'!text-right': isRTL}" />
              </UFormField>

              <UFormField :dir="isRTL ? 'rtl' : 'ltr'" name="call_use_lead_phone">
                <template #label>
                  <div class="flex items-center justify-between">
                    <span>Use lead phone</span>
                    <UToggle v-model="state.call_use_lead_phone" />
                  </div>
                </template>
              </UFormField>
            </div>

            <!-- Agenda / Notes -->
            <USeparator />
            <h4 class="text-md font-semibold">Agenda / Notes</h4>
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Details" name="description">
              <UTextarea v-model="state.description" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <!-- Visibility -->
            <USeparator />
            <h4 class="text-md font-semibold">Visibility</h4>
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Who can see this meeting?" name="visibility" required>
              <USelect v-model="state.visibility" :items="visibilityOptions" value-attribute="value" option-attribute="label" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UButton type="submit" :disabled="form?.errors.length">Create Meeting</UButton>
          </UForm>
        </UCard>

        <!-- Confirmation & Reminders Card -->
        <UCard class="mt-4">
          <template #header>
            <h3 class="text-lg font-semibold">Confirmation & Reminders</h3>
          </template>
          <div class="space-y-4">
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Send confirmation" name="sendConfirmation">
              <template #label>
                <div class="flex items-center justify-between">
                  <span>Send confirmation</span>
                  <UToggle v-model="state.sendConfirmation" />
                </div>
              </template>
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Channel" name="confirmationChannels" v-if="state.sendConfirmation">
              <UFieldGroup class="w-full" orientation="horizontal">
                <UButton
                  label="Email"
                  :variant="state.confirmationChannels.includes('email') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleChannel('email')"
                  class="flex-1"
                />
                <UButton
                  label="WhatsApp"
                  :variant="state.confirmationChannels.includes('whatsapp') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleChannel('whatsapp')"
                  class="flex-1"
                />
                <UButton
                  label="SMS"
                  :variant="state.confirmationChannels.includes('sms') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleChannel('sms')"
                  class="flex-1"
                />
              </UFieldGroup>

              <div v-if="!hasWhatsAppIntegration" class="mt-2">
                <UAlert
                  icon="i-heroicons-information-circle"
                  color="orange"
                  variant="subtle"
                  title="Connect WhatsApp to send confirmations"
                />
              </div>
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Reminders" name="reminderSchedule">
              <UFieldGroup class="w-full" orientation="horizontal">
                <UButton
                  label="24h"
                  :variant="state.reminderSchedule.includes('24h') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleReminder('24h')"
                  class="flex-1"
                />
                <UButton
                  label="2h"
                  :variant="state.reminderSchedule.includes('2h') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleReminder('2h')"
                  class="flex-1"
                />
                <UButton
                  label="15m"
                  :variant="state.reminderSchedule.includes('15m') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleReminder('15m')"
                  class="flex-1"
                />
                <UButton
                  label="Custom"
                  :variant="state.reminderSchedule.includes('custom') ? 'solid' : 'outline'"
                  color="neutral"
                  @click="toggleReminder('custom')"
                  class="flex-1"
                />
              </UFieldGroup>
            </UFormField>

            <UFormField
              v-if="state.reminderSchedule.includes('custom')"
              :dir="isRTL ? 'rtl' : 'ltr'"
              label="Custom Reminder Time (minutes)"
              name="customReminderTime"
              required
            >
              <UInput v-model.number="state.customReminderTime" type="number" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <USeparator />
            <h4 class="text-md font-semibold">Meeting AI</h4>
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Agenda AI Prompt" name="aiAgenda">
              <UTextarea v-model="state.aiAgenda" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Tags" name="tags">
              <UInput v-model="state.tags" placeholder="e.g., #important #followup" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Outcome Goal" name="outcomeGoal">
              <USelect v-model="state.outcomeGoal" :items="outcomeGoalOptions" value-attribute="value" option-attribute="label" class="w-full" :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Message Preview" name="messagePreview" description="This is how the confirmation message will look.">
              <UTextarea v-model="messagePreview" class="w-full" disabled :input-class="{'!text-right': isRTL}" />
            </UFormField>

            <!-- Message Language Override -->
            <UFormField :dir="isRTL ? 'rtl' : 'ltr'" label="Message Language Override" name="messageLanguageOverride" description="Manually override the message preview language.">
              <USelect
                v-model="state.messageLanguageOverride"
                :items="supportedLanguagesOptions"
                value-attribute="value"
                option-attribute="label"
                class="w-full"
                :input-class="{'!text-right': isRTL}"
              />
            </UFormField>

          </div>
        </UCard>
      </UPageBody>
    </UPageGrid>
  </UPage>
</template>
