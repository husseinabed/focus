<template>
  <UPage>
    <UPageHeader
      :title="lead?.company_name || $t('lead.edit.title')"
      :description="$t('lead.edit.subtitle')"
    >
      <template #actions>
        <UButton
          v-if="isDirty"
          color="warning"
          variant="soft"
          :label="$t('common.unsaved.title')"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <UContainer>
        <div v-if="pending" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-gray-400" />
        </div>
        
        <div v-else-if="error || !lead" class="text-center py-8">
          <p class="text-red-500">{{ error?.message || 'Lead not found' }}</p>
        </div>

        <UForm
          v-else
          :state="state"
          :schema="EditLeadSchema"
          @submit="onSubmit"
          class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
        >
          <!-- Left Column -->
          <div class="space-y-6">
            
            <!-- Dedupe Warning -->
            <UCard v-if="hasDuplicates" color="warning" variant="soft">
              <template #header>
                <h3 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-exclamation-triangle" />
                  {{ $t('lead.edit.dedupe.title') }}
                </h3>
              </template>
              <p class="text-sm mb-3">{{ $t('lead.edit.dedupe.subtitle') }}</p>
              <ul class="list-disc list-inside text-sm space-y-1 mb-4">
                <li v-for="dup in duplicateLeads" :key="dup.id">
                  <NuxtLink :to="localePath(`/app/leads/${dup.id}`)" target="_blank" class="underline font-medium">
                    {{ dup.company_name }}
                  </NuxtLink>
                  <span class="opacity-75"> ({{ dup.phone }})</span>
                </li>
              </ul>
            </UCard>

            <!-- Core Info -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ $t('lead.edit.sections.core') }}</h3>
              </template>
              <div class="space-y-4">
                <UFormField :label="$t('leads.fields.company_name')" name="company_name" required>
                  <UInput v-model="state.company_name" autofocus class="w-full" />
                </UFormField>
                
                <UFormField :label="$t('leads.fields.full_name')" name="full_name">
                  <UInput v-model="state.full_name" class="w-full" />
                </UFormField>

                <UFormField :label="$t('leads.fields.phone')" name="phone" required :help="$t('leads.tips.phone')">
                  <UInput v-model="state.phone" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <USeparator />

            <!-- Pipeline -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ $t('lead.edit.sections.pipeline') }}</h3>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField :label="$t('leads.fields.status')" name="status">
                  <USelect v-model="state.status" :items="statusOptions" class="w-full" />
                </UFormField>

                <UFormField :label="$t('leads.fields.priority')" name="priority">
                  <USelect v-model="state.priority" :items="priorityOptions"  class="w-full"/>
                </UFormField>

                <UFormField :label="$t('leads.fields.source')" name="source">
                  <USelect v-model="state.source" :items="sourceOptions" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <USeparator />

            <!-- Contact Details -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ $t('lead.edit.sections.contact') }}</h3>
              </template>
              <div class="space-y-4">
                <UFormField :label="$t('leads.fields.website')" name="website">
                  <UInput v-model="state.website" placeholder="https://" class="w-full" />
                </UFormField>

                <UFormField :label="$t('leads.fields.email')" name="email">
                  <UInput v-model="state.email" type="email" class="w-full" />
                </UFormField>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UFormField :label="$t('leads.fields.language')" name="language">
                    <USelect v-model="state.language" :items="languageOptions" class="w-full" />
                  </UFormField>

                  <UFormField :label="$t('leads.fields.city')" name="city">
                    <UInput v-model="state.city" class="w-full" />
                  </UFormField>
                </div>

                <!-- Address (mapped to custom_fields.address if not in DB schema) -->
                <UFormField :label="$t('leads.fields.address')" name="address">
                  <UInput v-model="state.address" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <USeparator />

            <!-- Internal -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ $t('lead.edit.sections.internal') }}</h3>
              </template>
              <div class="space-y-4">
                <UFormField :label="$t('leads.fields.notes')" name="notes">
                  <UTextarea v-model="state.notes" :rows="4" class="w-full" />
                </UFormField>

                <!-- Tags (Simple comma separated for now) -->
                 <UFormField :label="$t('leads.fields.tags')" name="tags">
                   <USelectMenu v-model="state.tags" multiple creatable searchable class="w-full" />
                </UFormField>

                <UFormField :label="$t('leads.fields.custom_fields')" name="custom_fields_json">
                  <UTextarea v-model="state.custom_fields_json" class="font-mono text-xs w-full" :rows="4"  />
                </UFormField>
              </div>
            </UCard>
          </div>

          <!-- Right Column (Sticky Sidebar) -->
          <div class="space-y-6 lg:sticky lg:top-4 h-fit">
            
            <!-- Summary -->
            <UCard>
              <template #header>
                <h3 class="font-semibold">{{ $t('lead.edit.summary.title') }}</h3>
              </template>
              <div class="flex flex-wrap gap-2 mb-4">
                <UBadge :color="statusColor[state.status] || 'neutral'" variant="subtle">{{ state.status }}</UBadge>
                <UBadge :color="priorityColor[state.priority] || 'neutral'" variant="subtle">{{ state.priority }}</UBadge>
                <UBadge color="neutral" variant="outline">{{ state.language }}</UBadge>
              </div>
              <div class="flex flex-col gap-2">
                <UButton
                  v-if="state.phone"
                  :to="`tel:${state.phone}`"
                  icon="i-heroicons-phone"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  block
                  class="justify-start"
                >
                  {{ state.phone }}
                </UButton>
                 <UButton
                  v-if="state.website"
                  :to="state.website"
                  target="_blank"
                  icon="i-heroicons-globe-alt"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  block
                   class="justify-start"
                >
                  {{ state.website }}
                </UButton>
              </div>
              
              <USeparator class="my-4" />
               <UButton type="submit" block color="primary" :loading="saving">
                {{ $t('common.save_changes') }} (Cmd+Enter)
              </UButton>
            </UCard>

            <!-- Next Actions -->
            <UCard>
              <template #header>
                <h3 class="font-semibold">{{ $t('lead.edit.next.title') }}</h3>
              </template>
              <div class="space-y-2">
                <UButton block color="neutral" variant="outline" icon="i-heroicons-inbox" @click="openInbox">
                   {{ $t('lead.actions.open_inbox') }}
                </UButton>
                 <UButton block color="neutral" variant="outline" icon="i-heroicons-check-circle" @click="qualifyLead">
                   {{ $t('lead.actions.qualify') }}
                </UButton>
                 <UButton block color="neutral" variant="outline" icon="i-heroicons-video-camera" @click="bookZoom">
                   {{ $t('lead.actions.book_zoom') }}
                </UButton>
              </div>
               <p class="text-xs text-gray-500 mt-3 text-center">
                 {{ $t('lead.edit.trust_note') }}
               </p>
            </UCard>

            <!-- Danger Zone -->
            <UCard class="border-red-200 dark:border-red-900">
              <template #header>
                <h3 class="font-semibold text-red-600">{{ $t('common.danger_zone') }}</h3>
              </template>
              <div class="space-y-2">
                <UButton block color="error" variant="soft" icon="i-heroicons-archive-box" @click="archiveLead">
                  {{ $t('lead.actions.archive') }}
                </UButton>
                <UButton block color="error" variant="ghost" icon="i-heroicons-trash" @click="deleteLead">
                  {{ $t('lead.actions.delete') }}
                </UButton>
              </div>
            </UCard>

          </div>
        </UForm>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { LeadSchema } from '~/types/leads'
import type { Lead } from '~/types/leads'

definePageMeta({
  layout: 'app' 
})

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()
const { t } = useI18n()
const toast = useToast()

const leadId = route.params.id as string
const saving = ref(false)
const originalState = ref('') // To track dirty state

// --- Data Fetching ---
const { data: lead, pending, error } = await useAsyncData(`lead:edit:${leadId}`, async () => {
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error) throw error
  return data
})

if (error.value) {
    console.error('Error fetching lead:', error.value)
}

// --- Schema ---
// Extend the base schema for local form needs if any
// We add address here as an optional string.
const EditLeadSchema = LeadSchema.extend({
  address: z.string().optional(),
  custom_fields_json: z.string().refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, 'Invalid JSON format')
})

// --- State ---
const state = reactive({
  company_name: '',
  full_name: '',
  phone: '',
  phone_e164: '',
  language: 'auto',
  city: '',
  address: '',
  source: 'manual',
  status: 'new',
  priority: 'medium',
  website: '',
  email: '',
  notes: '',
  tags: [] as string[],
  custom_fields_json: '{}'
})

// Initialize state when lead data is available
watchEffect(() => {
  if (lead.value) {
    state.company_name = lead.value.company_name || ''
    state.full_name = lead.value.full_name || ''
    state.phone = lead.value.phone || ''
    state.phone_e164 = lead.value.phone_e164 || ''
    state.language = lead.value.language || 'auto'
    state.city = lead.value.city || ''
    
    // Check if address is in custom_fields or root (if schema changes later)
    // @ts-ignore - 'address' might not exist on type yet
    state.address = lead.value.address || lead.value.custom_fields?.address || ''
    
    state.source = lead.value.source || 'manual'
    state.status = lead.value.status || 'new'
    state.priority = lead.value.priority || 'medium'
    state.website = lead.value.website || ''
    state.email = lead.value.email || ''
    state.notes = lead.value.notes || ''
    state.tags = lead.value.tags || []
    state.custom_fields_json = JSON.stringify(lead.value.custom_fields || {}, null, 2)
    
    originalState.value = JSON.stringify(state)
  }
})

// --- Options ---
const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
const priorityOptions = ['low', 'medium', 'high']
const sourceOptions = ['manual', 'import', 'google_maps', 'whatsapp_inbound']
const languageOptions = ['auto', 'he', 'ar', 'en']

const statusColor: Record<string, string> = {
  new: 'primary',
  contacted: 'orange',
  qualified: 'blue',
  proposal: 'purple',
  won: 'green',
  lost: 'red'
}

const priorityColor: Record<string, string> = {
  low: 'gray',
  medium: 'orange',
  high: 'red'
}

// --- Dedupe Logic ---
const duplicateLeads = ref<any[]>([])
const hasDuplicates = computed(() => duplicateLeads.value.length > 0)

watch(() => state.phone, async (newPhone) => {
  if (!newPhone || newPhone === lead.value?.phone) {
    duplicateLeads.value = []
    return
  }
  
  const { data } = await client
    .from('leads')
    .select('id, company_name, phone')
    .eq('phone', newPhone)
    .neq('id', leadId)
    .limit(5)
  
  if (data) duplicateLeads.value = data
})

// --- Dirty State ---
const isDirty = computed(() => {
  return JSON.stringify(state) !== originalState.value
})

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value) {
    const answer = window.confirm(t('common.unsaved.subtitle'))
    if (answer) next()
    else next(false)
  } else {
    next()
  }
})

// --- Actions ---
async function onSubmit() {
  saving.value = true
  try {
    const { custom_fields_json, address, ...rest } = state
    
    // Parse custom fields and add address to it if needed
    const custom_fields = JSON.parse(custom_fields_json)
    if (address) {
        custom_fields.address = address
    }

    const updates = {
      ...rest,
      custom_fields,
      updated_at: new Date().toISOString()
    }

    const { error } = await client
      .from('leads')
      .update(updates)
      .eq('id', leadId)

    if (error) throw error

    toast.add({
      title: t('lead.edit.saved'),
      color: 'success'
    })
    
    // Update original state to reflect saved changes
    originalState.value = JSON.stringify(state)
    
    // Refresh data
    refreshNuxtData(`lead:edit:${leadId}`)

  } catch (e: any) {
    console.error(e)
    toast.add({
      title: t('common.save_failed'),
      description: e.message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Shortcuts
defineShortcuts({
  meta_enter: {
    usingInput: true,
    handler: onSubmit
  },
  ctrl_enter: {
    usingInput: true,
    handler: onSubmit
  }
})

// Sidebar Actions
function openInbox() {
  router.push(localePath(`/app/inbox?lead=${leadId}`))
}

function qualifyLead() {
  router.push(localePath(`/app/lead-qualification?lead=${leadId}`))
}

function bookZoom() {
  router.push(localePath(`/app/meetings/new?lead=${leadId}&type=proposal`))
}

async function archiveLead() {
  if (!confirm('Are you sure you want to archive this lead?')) return
  // Implement archive
  toast.add({ title: 'Archived (Not implemented)' })
}

async function deleteLead() {
  if (!confirm('Are you sure you want to DELETE this lead? This action cannot be undone.')) return
  
  const { error } = await client.from('leads').delete().eq('id', leadId)
  if (error) {
     toast.add({ title: 'Delete failed', color: 'error' })
  } else {
     toast.add({ title: 'Lead deleted', color: 'success' })
     router.push(localePath('/app/leads'))
  }
}
</script>
