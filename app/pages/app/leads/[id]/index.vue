<template>
  <div v-if="lead" class="pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-start gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          color="neutral"
          variant="ghost"
          to="/app/leads"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ lead.company_name }}
          </h1>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            <UBadge :color="getStatusColor(lead.status)" variant="subtle">
              {{ $t(`common.status.${lead.status}`) }}
            </UBadge>
            <span class="text-sm text-gray-500">•</span>
            <span class="text-sm text-gray-500">{{ $t(`common.sources.${lead.source}`) }}</span>
            <span class="text-sm text-gray-500">•</span>
            <span class="text-sm text-gray-500 uppercase">{{ lead.language }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <UButton
          icon="i-heroicons-chat-bubble-left-right"
          color="neutral"
          variant="soft"
          @click="openInbox"
        >
          {{ $t('nav.inbox') }}
        </UButton>
        <UButton
          icon="i-heroicons-clipboard-document-check"
          color="neutral"
          variant="soft"
          @click="startQualification"
        >
          {{ $t('leads.new.next_steps.qualify_call') }}
        </UButton>
        <UButton
          icon="i-heroicons-video-camera"
          color="primary"
          @click="bookZoom"
        >
          {{ $t('leads.new.next_steps.book_proposal') }}
        </UButton>
        <UDropdown :items="actionItems">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-ellipsis-vertical"
          />
        </UDropdown>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(320px,380px)_1fr] gap-6 items-start">
      
      <!-- Left Panel (Sticky) -->
      <div class="space-y-6 lg:sticky lg:top-4">
        <!-- Identity Card -->
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center justify-between group">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                <span>{{ lead.phone }}</span>
              </div>
              <UButton
                icon="i-heroicons-document-duplicate"
                size="xs"
                color="neutral"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click="copyToClipboard(lead.phone)"
              />
            </div>
            
            <div v-if="lead.email" class="flex items-center justify-between group">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
                <a :href="`mailto:${lead.email}`" class="hover:underline">{{ lead.email }}</a>
              </div>
              <UButton
                icon="i-heroicons-document-duplicate"
                size="xs"
                color="neutral"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                @click="copyToClipboard(lead.email!)"
              />
            </div>

            <div v-if="lead.website" class="flex items-center justify-between group">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                <a :href="lead.website" target="_blank" class="hover:underline truncate max-w-[200px]">{{ lead.website }}</a>
              </div>
              <UButton
                icon="i-heroicons-arrow-top-right-on-square"
                size="xs"
                color="neutral"
                variant="ghost"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                :to="lead.website"
                target="_blank"
              />
            </div>

             <div v-if="lead.city" class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                <span>{{ lead.city }}</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Qualification Snapshot -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ $t('leads.new.details.qualifications') }}</h3>
          </template>
          
          <div v-if="qualification">
            <div class="flex items-center justify-between mb-4">
               <span class="text-sm text-gray-500">Score</span>
               <UBadge :color="getScoreColor(qualification.score)" variant="subtle">{{ qualification.score || 'N/A' }}</UBadge>
            </div>
            <div v-if="qualification.status" class="flex items-center justify-between mb-4">
               <span class="text-sm text-gray-500">Status</span>
               <UBadge :color="getQualificationStatusColor(qualification.status)" variant="subtle">{{ qualification.status }}</UBadge>
            </div>
            <!-- Top answers could go here if available in json/structure -->
             <div v-if="qualification.summary" class="text-sm text-gray-600 dark:text-gray-300 mt-2">
               {{ qualification.summary }}
             </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-sm text-gray-500 mb-3">No qualification data yet</p>
            <UButton size="sm" color="neutral" variant="soft" @click="startQualification">
              {{ $t('leads.new.next_steps.start_outreach') }}
            </UButton>
          </div>
        </UCard>

        <!-- Workflow Controls -->
        <UCard>
           <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">Workflow</h3>
          </template>
          <div class="space-y-3">
             <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Current Status</span>
                <UBadge color="neutral" variant="subtle">Idle</UBadge>
             </div>
             <div class="grid grid-cols-2 gap-2">
                <UButton size="sm" color="neutral" variant="soft" icon="i-heroicons-play" block>Start</UButton>
                <UButton size="sm" color="neutral" variant="soft" icon="i-heroicons-stop" block>Stop</UButton>
             </div>
          </div>
        </UCard>

        <!-- Next Steps -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ $t('leads.new.next_steps.title') }}</h3>
          </template>
          <div class="space-y-2">
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="justify-start"
              icon="i-heroicons-paper-airplane"
            >
              {{ $t('leads.new.next_steps.start_outreach') }}
            </UButton>
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="justify-start"
              icon="i-heroicons-phone"
            >
              {{ $t('leads.new.next_steps.qualify_call') }}
            </UButton>
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="justify-start"
              icon="i-heroicons-calendar"
            >
              {{ $t('leads.new.next_steps.book_proposal') }}
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Right Panel -->
      <div class="min-w-0">
        <UTabs :items="tabs" class="w-full">
          <!-- Messages Tab -->
          <template #messages>
            <div class="space-y-4 mt-4">
              <div v-if="conversation?.approval_required" class="bg-yellow-50 dark:bg-yellow-900/20 border-s-4 border-yellow-400 p-4 rounded-e-md mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-yellow-400" />
                  </div>
                  <div class="ms-3">
                    <p class="text-sm text-yellow-700 dark:text-yellow-200">
                      {{ $t('auth.trust.badge') }} - {{ $t('auth.trust.note') }}
                    </p>
                  </div>
                </div>
              </div>

              <InboxThreadBodyPreview :messages="messages" />

              <div class="flex justify-center">
                 <UButton variant="link" color="primary" @click="openInbox">
                   Open full inbox
                 </UButton>
              </div>
            </div>
          </template>

          <!-- Activity Tab -->
          <template #activity>
            <div class="mt-4">
              <UCard>
                <div class="text-center py-8 text-gray-500">
                  Timeline placeholder (grouped by date)
                </div>
              </UCard>
            </div>
          </template>

          <!-- Meetings Tab -->
          <template #meetings>
            <div class="mt-4 space-y-4">
              <UCard v-for="meeting in meetings" :key="meeting.id">
                <div class="flex items-start justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">{{ meeting.title }}</h4>
                    <p class="text-sm text-gray-500">
                      {{ new Date(meeting.start_time).toLocaleString() }} - 
                      {{ new Date(meeting.end_time).toLocaleTimeString() }}
                    </p>
                  </div>
                   <UBadge :color="getMeetingStatusColor(meeting.status)" variant="subtle">
                      {{ meeting.status }}
                   </UBadge>
                </div>
              </UCard>
              <div v-if="!meetings || meetings.length === 0" class="text-center py-8 text-gray-500">
                 No meetings scheduled.
              </div>
            </div>
          </template>

          <!-- Notes Tab -->
          <template #notes>
            <div class="mt-4">
              <UCard>
                <form @submit.prevent="saveNotes">
                  <UFormField label="Notes">
                    <UTextarea
                      v-model="notesForm.notes"
                      :rows="6"
                      :placeholder="$t('leads.fields.notes')"
                      class="w-full"
                    />
                  </UFormField>
                  <div class="flex justify-end mt-4">
                    <UButton type="submit" :loading="savingNotes" color="primary">
                      {{ $t('leads.details.save_notes') }}
                    </UButton>
                  </div>
                </form>
              </UCard>
            </div>
          </template>
        </UTabs>
      </div>
    </div>
  </div>
  <div v-else-if="status === 'pending'" class="flex justify-center items-center min-h-[400px]">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
  </div>
  <div v-else class="text-center py-10">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Lead not found</h2>
    <UButton to="/app/leads" color="primary" variant="soft">Back to Leads</UButton>
  </div>
</template>

<script setup lang="ts">
import type { Lead, LeadQualification, Conversation, Meeting } from '~/types/leads';

definePageMeta({
  layout: 'app'
});

const route = useRoute();
const client = useSupabaseClient();
const toast = useToast();
const { t } = useI18n();

const leadId = route.params.id as string;

// Data Fetching
const { data, status, error, refresh } = await useAsyncData(`lead-data-${leadId}`, async () => {
  const [leadRes, qualRes, convRes, meetingsRes] = await Promise.all([
    client.from('leads').select('*').eq('id', leadId).single(),
    client.from('lead_qualifications').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('conversations').select('*').eq('lead_id', leadId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('meetings').select('*').eq('lead_id', leadId).order('start_time', { ascending: true }).limit(20)
  ]);

  if (leadRes.error) throw leadRes.error;

  // Fetch messages if conversation exists
  let messagesData: any[] = [];
  if (convRes.data) {
      const msgsRes = await client.from('messages').select('*').eq('conversation_id', convRes.data.id).order('created_at', { ascending: true });
      if (msgsRes.data) messagesData = msgsRes.data;
  }

  return {
    lead: leadRes.data as Lead,
    qualification: qualRes.data as LeadQualification | null,
    conversation: convRes.data as Conversation & { approval_required?: boolean } | null,
    meetings: meetingsRes.data as Meeting[] | null,
    messages: messagesData
  };
});

if (error.value) {
  // Handle error (e.g. redirect)
  // We can just log it or let the template show the error state, but let's try to redirect or show a message
  console.error('Error loading lead', error.value);
}

const lead = computed(() => data.value?.lead);
const qualification = computed(() => data.value?.qualification);
const conversation = computed(() => data.value?.conversation);
const meetings = computed(() => data.value?.meetings);
const messages = computed(() => data.value?.messages || []);

// Tabs configuration
const tabs = [
  { label: t('leads.details.tabs.messages'), slot: 'messages' },
  { label: t('leads.details.tabs.activity'), slot: 'activity' },
  { label: t('leads.details.tabs.meetings'), slot: 'meetings' },
  { label: t('leads.details.notes'), slot: 'notes' }
];

// Notes handling
const notesForm = reactive({
  notes: ''
});

watch(() => lead.value?.notes, (newNotes) => {
  if (newNotes) notesForm.notes = newNotes;
}, { immediate: true });

const savingNotes = ref(false);

const saveNotes = async () => {
  if (!lead.value) return;
  
  savingNotes.value = true;
  try {
    const { error } = await client
      .from('leads')
      .update({ notes: notesForm.notes })
      .eq('id', leadId);

    if (error) throw error;
    
    toast.add({
      title: 'Notes saved',
      color: 'green'
    });
    refresh(); // Refresh data to ensure sync
  } catch (e) {
    toast.add({
      title: 'Error saving notes',
      description: (e as Error).message,
      color: 'red'
    });
  } finally {
    savingNotes.value = false;
  }
};

// Utils
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.add({ title: 'Copied to clipboard', timeout: 2000 });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    new: 'blue',
    contacted: 'orange',
    qualified: 'green',
    proposal: 'purple',
    won: 'green',
    lost: 'red'
  };
  return colors[status] || 'neutral';
};

const getScoreColor = (score?: number) => {
    if (!score) return 'neutral';
    if (score >= 80) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
}

const getQualificationStatusColor = (status: string) => {
    switch(status) {
        case 'qualified': return 'green';
        case 'disqualified': return 'red';
        default: return 'orange';
    }
}

const getMeetingStatusColor = (status: string) => {
    switch(status) {
        case 'scheduled': return 'blue';
        case 'completed': return 'green';
        case 'cancelled': return 'red';
        case 'no_show': return 'neutral';
        default: return 'neutral';
    }
}

// Actions (Placeholders)
const openInbox = () => {
  navigateTo('/app/inbox');
};

const startQualification = () => {
  // Navigate to qualification page or open modal
  console.log('Start qualification');
};

const bookZoom = () => {
  console.log('Book Zoom');
};

const actionItems = [
    [{
        label: 'Archive Lead',
        icon: 'i-heroicons-archive-box',
        click: () => console.log('Archive')
    }, {
        label: 'Delete Lead',
        icon: 'i-heroicons-trash',
        color: 'red',
        click: () => console.log('Delete')
    }]
]
</script>