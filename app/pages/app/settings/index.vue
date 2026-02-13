<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useWorkspaceStore } from '~/stores/workspace'
import type { WorkspaceSettings } from '~~/server/utils/workspace' // Assuming this type exists or inferring structure

definePageMeta({
  layout: 'app'
})
// UI Components imported via setup script context
// UCard, UButton, UTabs, UFormField, UInput, USelect are assumed available

// --- i18n Access ---
const { t } = useI18n()

// --- Configuration Mock for UI Tabs ---
interface NavItem {
  key: string
  label: string
  icon: string
  description: string
}

interface TabItem {
  key: string
  titleKey: string
  subtitleKey: string
  sectionId: string // Added to map to section ID
  sectionType: 'Form' | 'Card' | 'List' // Added to map to section type
}

interface UISettingsV1 {
  activeTab: string
  nav: {
    items: NavItem[]
  }
  tabs: {
    items: TabItem[]
  }
}

// The instruction mentioned: ui.settings.v1.tabs.items[0] is 'workspace'
const uiSettingsV1: UISettingsV1 = {
  activeTab: 'workspace',
  nav: {
    items: [
      { key: 'workspace', label: 'settings.nav.workspace', icon: 'i-heroicons-squares-2x2', description: 'settings.nav.workspace_desc' },
      { key: 'team', label: 'settings.nav.team', icon: 'i-heroicons-users', description: 'settings.nav.team_desc' },
      { key: 'integrations', label: 'settings.nav.integrations', icon: 'i-lucide-zap', description: 'settings.nav.integrations_desc' },
      { key: 'billing', label: 'settings.nav.billing', icon: 'i-heroicons-credit-card', description: 'settings.nav.billing_desc' },
      { key: 'security', label: 'settings.nav.security', icon: 'i-heroicons-shield-check', description: 'settings.nav.security_desc' },
      { key: 'profile', label: 'settings.nav.profile', icon: 'i-heroicons-user', description: 'settings.nav.profile_desc' },
    ]
  },
  tabs: {
    items: [
      { key: 'workspace', titleKey: 'settings.workspace.title', subtitleKey: 'settings.workspace.description', sectionId: 'workspace_profile', sectionType: 'Card' },
      {
        key: 'team',
        titleKey: 'settings.team.title',
        subtitleKey: 'settings.team.description',
        sectionId: 'members',
        sectionType: 'Card',
        sections: [
          {
            id: 'members',
            type: 'Card',
            table: {
              columns: [
                { id: 'user', accessorKey: 'user', header: 'settings.team.columns.user' },
                { id: 'role', accessorKey: 'role', header: 'settings.team.columns.role' },
                { id: 'created_at', accessorKey: 'created_at', header: 'settings.team.columns.created_at' },
                { id: 'actions', accessorKey: 'actions', header: '' }
              ]
            }
          }
        ]
      } as any,
      {
        key: 'integrations',
        titleKey: 'settings.integrations.title',
        subtitleKey: 'settings.integrations.description',
        sectionId: 'integrations_container',
        sectionType: 'List',
        sections: [
          {
            id: 'integrations_overview',
            type: 'Card',
            notice: {
              icon: 'i-heroicons-information-circle',
              text: 'settings.integrations.notice_text'
            }
          },
          {
            id: 'integration_cards',
            type: 'Grid',
            columns: { base: 1, md: 2, xl: 3 },
            gap: 12,
            items: [
              {
                id: 'twilio_whatsapp',
                icon: 'i-simple-icons-twilio',
                title: 'Twilio WhatsApp',
                descriptionKey: 'settings.integrations.twilio_whatsapp.description',
                statusFrom: 'integrations.twilio_whatsapp.status',
                actions: [
                  { key: 'settings.integrations.twilio_whatsapp.open', label: 'common.configure', color: 'primary' },
                  { key: 'settings.integrations.twilio_whatsapp.docs', label: 'common.docs', color: 'neutral', variant: 'ghost' }
                ]
              },
              {
                id: 'email_smtp',
                icon: 'i-heroicons-envelope',
                title: 'Email (SMTP)',
                descriptionKey: 'settings.integrations.email_smtp.description',
                statusFrom: 'integrations.email_smtp.status',
                actions: [
                  { key: 'settings.integrations.email_smtp.open', label: 'common.configure', color: 'primary' }
                ]
              },
              {
                id: 'google_calendar',
                icon: 'i-simple-icons-googlecalendar',
                title: 'Google Calendar',
                descriptionKey: 'settings.integrations.google_calendar.description',
                statusFrom: 'integrations.google_calendar.status',
                actions: [
                  { key: 'settings.integrations.google_calendar.open', label: 'common.connect', color: 'primary' }
                ]
              }
            ]
          }
        ]
      } as any,
      { key: 'billing', titleKey: 'settings.billing.title', subtitleKey: 'settings.billing.description', sectionId: 'billing_summary', sectionType: 'Card' },
      { key: 'security', titleKey: 'settings.security.title', subtitleKey: 'settings.security.description', sectionId: 'security_settings', sectionType: 'Card' },
      { key: 'profile', titleKey: 'settings.profile.title', subtitleKey: 'settings.profile.description', sectionId: 'profile_details', sectionType: 'Form' },
    ]
  },
  actions: {
    'settings.workspace.save': { type: 'mutation' },
    'settings.integrations.twilio_whatsapp.save': { type: 'mutation' },
    'settings.integrations.email_smtp.save': { type: 'mutation' },
    'settings.team.remove': { type: 'confirmation', title: 'settings.team.remove_confirm_title', description: 'settings.team.remove_confirm_desc' }
  }
}

// --- State Management ---
const workspaceStore = useWorkspaceStore()
const activeTabKey = ref(uiSettingsV1.activeTab)

// --- Language/Timezone Options Mock (Assuming these come from an i18n resource) ---
const availableLanguages = computed(() => [
  { label: 'English', value: 'en' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Arabic', value: 'ar' },
])

const availableTimezones = computed(() => [
  { label: 'Asia/Jerusalem (UTC+2)', value: 'Asia/Jerusalem' },
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (UTC-5)', value: 'America/New_York' },
])

// --- Workspace Form State (Step 4) ---
// Structure inferred from requirement keys: workspace.name, workspace.slug, workspace.default_language, workspace.timezone
const workspaceFormState = reactive({
  name: ref(''),
  slug: ref(''),
  default_language: ref('en'), // Custom rule: use default values
  timezone: ref('UTC'),        // Custom rule: use default values
  admin_email: ref(''),
  security_password: ref(''), // For password field simulation
})

// Simulate loading initial state from store/API (Step 4)
onMounted(() => {
  // Mock initial data fetch for workspace settings
  workspaceFormState.name = 'My Company Workspace'
  workspaceFormState.slug = 'my-company'
  workspaceStore.fetchWorkspaceSettings = async () => {
      // Mock fetch/store action
      return {
          name: 'My Company Workspace',
          slug: 'my-company',
          default_language: 'en',
          timezone: 'Asia/Jerusalem',
          admin_email: 'admin@mycompany.com',
          security_password: '' // never load actual password
      } as WorkspaceSettings
  }

  // Set initial reactive values
  workspaceFormState.name = 'My Company Workspace'
  workspaceFormState.slug = 'my-company'
  workspaceFormState.default_language = 'en'
  workspaceFormState.timezone = 'Asia/Jerusalem'
  workspaceFormState.admin_email = 'admin@mycompany.com'
  
  // For demonstration, we set defaults based on what seems reasonable, aligning with the requirement to set defaults.
  // The store might handle the actual setting, but for the component template, we populate the local state.
})

// --- Mock Data for Team Tab ---
const teamMembers = ref([
  { id: 1, user: 'John Doe', role: 'admin', created_at: '2023-01-01' },
  { id: 2, user: 'Jane Smith', role: 'member', created_at: '2023-02-15' },
])

// --- Computed Properties for Dynamic Content ---
const currentTabContent = computed(() => {
  return uiSettingsV1.tabs.items.find(item => item.key === activeTabKey.value)
})

// --- Tab Handlers (Step 2) ---
function handleTabChange(key: string) {
  activeTabKey.value = key
}

// --- Navigation Item Definitions for UButton rendering (Step 3) ---
const navItems = computed(() => uiSettingsV1.nav.items)

// --- Mobile Tabs Definition for UTabs binding (Step 5) ---
const tabItems = computed(() => uiSettingsV1.tabs.items.map(item => ({
  key: item.key,
  label: t(`settings.nav.${item.key}`), // Use i18n for labels
})))

// --- Action & Toast Handlers ---
const toast = useToast()
const isSaving = ref(false)

const confirmationState = reactive({
  open: false,
  title: '',
  description: '',
  onConfirm: () => {},
})

async function dispatchAction(actionKey: string, payload?: any) {
  const actionConfig = (uiSettingsV1 as any).actions?.[actionKey]

  if (actionConfig?.type === 'confirmation') {
    confirmationState.title = t(actionConfig.title)
    confirmationState.description = t(actionConfig.description)
    confirmationState.onConfirm = () => {
      confirmationState.open = false
      executeAction(actionKey, payload)
    }
    confirmationState.open = true
    return
  }

  await executeAction(actionKey, payload)
}

async function executeAction(actionKey: string, payload?: any) {
  if (actionKey === 'settings.workspace.save') {
    await handleSubmit()
    return
  }

  if (actionKey === 'settings.integrations.twilio_whatsapp.open') {
    drawersState.twilio_whatsapp = true
    return
  }

  if (actionKey === 'settings.integrations.email_smtp.open') {
    drawersState.email_smtp = true
    return
  }

  if (actionKey === 'settings.integrations.twilio_whatsapp.save') {
    isSaving.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.add({ title: t('settings.integrations.twilio_whatsapp.saved'), color: 'success' })
    drawersState.twilio_whatsapp = false
    isSaving.value = false
    return
  }

  if (actionKey === 'settings.integrations.email_smtp.save') {
    isSaving.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.add({ title: t('settings.integrations.email_smtp.saved'), color: 'success' })
    drawersState.email_smtp = false
    isSaving.value = false
    return
  }

  if (actionKey === 'settings.team.remove') {
    toast.add({ title: t('settings.team.removed_success'), color: 'success' })
    teamMembers.value = teamMembers.value.filter(m => m.id !== payload)
    return
  }

  if (actionKey === 'settings.integrations.google_calendar.open') {
    toast.add({ title: t('settings.integrations.google_calendar.connecting'), color: 'neutral' })
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.add({ title: t('settings.integrations.google_calendar.connected'), color: 'success' })
    return
  }
}

// --- Form Submission Logic ---
const handleSubmit = async () => {
  isSaving.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  toast.add({
    title: t('settings.workspace.saved_success'),
    color: 'success'
  })
  isSaving.value = false
}

// --- Integrations State & Handlers ---
const drawersState = reactive({
  twilio_whatsapp: false,
  email_smtp: false,
  google_calendar: false,
})

const integrationsFormState = reactive({
  twilio_whatsapp: {
    account_sid: '',
    auth_token: '',
    phone_number: '',
  },
  email_smtp: {
    host: '',
    port: 587,
    user: '',
    pass: '',
  }
})

const getIntegrationStatus = (statusPath: string) => {
  // Simulated status check
  return 'connected' // or 'disconnected'
}
</script>

<template>
  <!-- Main container with RTL direction and base styling -->
  <div dir="rtl" class="min-h-screen bg-background text-foreground">

    <div class="container mx-auto px-4 py-8 lg:px-8 lg:py-12">
      <h1 class="text-3xl font-bold mb-6">{{ t('settings.nav.title', 'Settings') }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <!-- Left Column: Navigation Sidebar (Hidden on mobile, replaced by UTabs) -->
        <aside class="hidden lg:block sticky top-8 self-start">
          <UCard class="p-0 overflow-hidden">
            <div class="flex flex-col gap-1 p-2">
              <div v-for="item in navItems" :key="item.key">
                <!-- Navigation structure using UButton, adhering to custom rules -->
                <UButton
                  :icon="item.icon"
                  :label="t(`settings.nav.${item.key}`, item.label)"
                  variant="ghost"
                  color="neutral"
                  class="w-full justify-start"
                  :class="{ 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300': activeTabKey === item.key }"
                  @click="handleTabChange(item.key)"
                >
                
                </UButton>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400 hidden md:block ps-3">{{ t(item.description) }}</span>

              </div>
            </div>
          </UCard>
        </aside>

        <!-- Right Column: Content Area -->
        <main>
          <!-- Mobile Tab control (UTabs) - Visible on small screens only -->
          <div class="lg:hidden mb-6">
            <UTabs
              v-model="activeTabKey"
              :items="tabItems"
              class="w-full"
            />
          </div>

          <!-- Content Area: Conditional rendering based on activeTabKey -->
          <div v-if="currentTabContent">
            
            <!-- Implementation for team tab -->
            <div v-if="currentTabContent.key === 'team'">
              <UCard class="shadow-lg">
                <template #header>
                  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 class="text-xl font-semibold">{{ t(currentTabContent.titleKey, currentTabContent.titleKey) }}</h2>
                      <p class="mt-1 text-sm text-neutral-500">{{ t(currentTabContent.subtitleKey, currentTabContent.subtitleKey) }}</p>
                    </div>
                    <UButton
                      icon="i-heroicons-user-plus"
                      :label="t('settings.team.invite', 'Invite Member')"
                      color="primary"
                      variant="solid"
                      class="w-full sm:w-auto"
                    />
                  </div>
                </template>

                <div v-for="section in (currentTabContent as any).sections" :key="section.id" class="mt-4">
                  <div v-if="section.id === 'members'">
                    <UTable
                      :data="teamMembers"
                      :columns="section.table.columns"
                      class="w-full"
                    >
                      <!-- Custom Cell Renderers -->
                      <template #user-cell="{ row }">
                        <div class="flex items-center gap-3">
                          <UAvatar :alt="row.original.user || ''" size="sm" />
                          <span class="font-medium">{{ row.original.user }}</span>
                        </div>
                      </template>

                      <template #role-cell="{ row }">
                        <UBadge color="neutral" variant="subtle">
                          {{ row.original.role }}
                        </UBadge>
                      </template>

                      <template #created_at-cell="{ row }">
                        <span class="text-neutral-500">{{ row.original.created_at }}</span>
                      </template>

                      <template #actions-cell="{ row }">
                        <div class="flex items-center gap-2">
                          <UButton
                            icon="i-heroicons-pencil-square"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            @click="dispatchAction('settings.team.changeRole', row.original.id)"
                          />
                          <UButton
                            icon="i-heroicons-trash"
                            variant="ghost"
                            color="error"
                            size="sm"
                            @click="dispatchAction('settings.team.remove', row.original.id)"
                          />
                        </div>
                      </template>
                    </UTable>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Implementation for workspace_profile Card (Task 1, 2) -->
            <div v-else-if="currentTabContent.key === 'workspace'">
              <UCard class="shadow-lg" :ui="{ shadow: 'shadow-xl' }">
                <template #header>
                  <h2 class="text-xl font-semibold">{{ t(currentTabContent.titleKey, currentTabContent.titleKey) }}</h2>
                  <p class="mt-1 text-sm text-neutral-500">{{ t(currentTabContent.subtitleKey, currentTabContent.subtitleKey) }}</p>
                </template>

                <!-- Form starts here (Task 3, 4, 5) -->
                <UForm :id="'workspace_form'" @submit="handleSubmit" class="space-y-6">
                  <!-- Workspace Name -->
                  <UFormField
                    :name="'workspace.name'"
                    :label="t('common.name', 'Name')"
                    required
                    :description="t('settings.fields.workspace_name_desc')"
                  >
                    <UInput
                      v-model="workspaceFormState.name"
                      class="w-full"
                      :placeholder="t('common.name', 'Name')"
                    />
                  </UFormField>

                  <!-- Workspace Slug -->
                  <UFormField
                    :name="'workspace.slug'"
                    :label="t('settings.fields.slug', 'Slug')"
                    required
                    :description="t('settings.fields.slug_desc')"
                  >
                    <UInput
                      v-model="workspaceFormState.slug"
                      class="w-full"
                      :placeholder="t('settings.fields.slug_placeholder', 'e.g. my-company')"
                    />
                  </UFormField>

                  <!-- Default Language (Select) -->
                  <UFormField
                    :name="'workspace.default_language'"
                    :label="t('settings.fields.default_language', 'Default Language')"
                    required
                    :description="t('settings.fields.default_language_desc')"
                  >
                    <USelect
                      v-model="workspaceFormState.default_language"
                      :items="availableLanguages"
                      value-key="value"
                      option-label="label"
                      :items-key="'value'"
                      class="w-full"
                    />
                  </UFormField>

                  <!-- Timezone (Select) -->
                  <UFormField
                    :name="'workspace.timezone'"
                    :label="t('settings.fields.timezone', 'Timezone')"
                    required
                    :description="t('settings.fields.timezone_desc')"
                  >
                    <USelect
                      v-model="workspaceFormState.timezone"
                      :items="availableTimezones"
                      value-key="value"
                      option-label="label"
                      :items-key="'value'"
                      class="w-full"
                    />
                  </UFormField>
                  
                  <!-- Admin Email (Input) -->
                  <UFormField
                    :name="'workspace.admin_email'"
                    :label="t('settings.fields.admin_email', 'Admin Email')"
                    required
                    :description="t('settings.fields.admin_email_desc')"
                  >
                    <UInput
                      v-model="workspaceFormState.admin_email"
                      type="email"
                      class="w-full"
                      :placeholder="t('settings.fields.admin_email_placeholder')"
                    />
                  </UFormField>

                  <!-- Password Field (Input type="password") -->
                  <UFormField
                    :name="'workspace.security_password'"
                    :label="t('settings.fields.security_password', 'Security Password')"
                    :description="t('settings.fields.security_password_desc', 'Enter current password to confirm changes to sensitive settings.')"
                    required
                  >
                    <UInput
                      v-model="workspaceFormState.security_password"
                      type="password"
                      class="w-full"
                      :placeholder="t('settings.fields.security_password_placeholder', '••••••••')"
                    />
                  </UFormField>

                  <!-- Submit Button (Task 5) -->
                  <USeparator class="mt-8" />
                  <div class="flex justify-end pt-4">
                    <UButton
                      type="submit"
                      :label="t('common.save', 'Save')"
                      :loading="isSaving"
                      color="primary"
                      variant="solid"
                      class="min-w-[120px]"
                    />
                  </div>
                </UForm>

              </UCard>
            </div>
            
            <!-- Implementation for integrations tab (Task 1, 2, 3, 4) -->
            <div v-else-if="currentTabContent.key === 'integrations'" class="space-y-6">
              <div v-for="section in (currentTabContent as any).sections" :key="section.id">
                
                <!-- Notice Section -->
                <div v-if="section.id === 'integrations_overview'">
                  <UAlert
                    :icon="section.notice.icon"
                    :title="t(section.notice.text)"
                    color="neutral"
                    variant="subtle"
                  />
                </div>

                <!-- Integration Cards Grid -->
                <div v-if="section.id === 'integration_cards'" :class="`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`" :style="{ gap: section.gap + 'px' }">
                  <UCard v-for="item in section.items" :key="item.id" class="flex flex-col h-full">
                    <template #header>
                      <div class="flex items-center gap-3">
                        <UIcon :name="item.icon" class="w-8 h-8 text-primary" />
                        <div>
                          <h3 class="font-semibold">{{ item.title }}</h3>
                          <UBadge
                            :color="getIntegrationStatus(item.statusFrom) === 'connected' ? 'success' : 'neutral'"
                            variant="subtle"
                            size="sm"
                          >
                            {{ getIntegrationStatus(item.statusFrom) }}
                          </UBadge>
                        </div>
                      </div>
                    </template>

                    <p class="text-sm text-neutral-500 flex-1">
                      {{ t(item.descriptionKey) }}
                    </p>

                    <template #footer>
                      <div class="flex items-center gap-2">
                        <UButton
                          v-for="action in item.actions"
                          :key="action.key"
                          :label="action.label"
                          :color="action.color || 'neutral'"
                          :variant="action.variant || 'solid'"
                          size="sm"
                          @click="dispatchAction(action.key)"
                        />
                      </div>
                    </template>
                  </UCard>
                </div>
              </div>
            </div>

            <!-- Billing Tab -->
            <div v-else-if="currentTabContent.key === 'billing'">
              <UCard class="shadow-lg">
                <template #header>
                  <h2 class="text-xl font-semibold">{{ t(currentTabContent.titleKey) }}</h2>
                  <p class="mt-1 text-sm text-neutral-500">{{ t(currentTabContent.subtitleKey) }}</p>
                </template>
                <div class="h-64 flex flex-col items-center justify-center text-center p-8">
                  <UIcon name="i-heroicons-credit-card" class="w-12 h-12 text-neutral-400 mb-4" />
                  <p class="text-lg font-medium text-neutral-900 dark:text-white">{{ t('settings.billing.coming_soon') }}</p>
                  <p class="text-sm text-neutral-500 mt-1 max-w-xs">{{ t('settings.billing.coming_soon_desc', 'We are working hard to bring subscription management and payment history to you.') }}</p>
                </div>
              </UCard>
            </div>

            <!-- Security Tab -->
            <div v-else-if="currentTabContent.key === 'security'">
              <UCard class="shadow-lg">
                <template #header>
                  <h2 class="text-xl font-semibold">{{ t(currentTabContent.titleKey) }}</h2>
                  <p class="mt-1 text-sm text-neutral-500">{{ t(currentTabContent.subtitleKey) }}</p>
                </template>
                <div class="h-64 flex flex-col items-center justify-center text-center p-8">
                  <UIcon name="i-heroicons-shield-check" class="w-12 h-12 text-neutral-400 mb-4" />
                  <p class="text-lg font-medium text-neutral-900 dark:text-white">{{ t('settings.security.coming_soon') }}</p>
                  <p class="text-sm text-neutral-500 mt-1 max-w-xs">{{ t('settings.security.coming_soon_desc', 'Enhanced security features like Two-Factor Authentication and Audit Logs are on their way.') }}</p>
                </div>
              </UCard>
            </div>

            <!-- Profile Tab (Minimal) -->
            <div v-else-if="currentTabContent.key === 'profile'">
              <UCard class="shadow-lg">
                <template #header>
                  <h2 class="text-xl font-semibold">{{ t(currentTabContent.titleKey) }}</h2>
                  <p class="mt-1 text-sm text-neutral-500">{{ t(currentTabContent.subtitleKey) }}</p>
                </template>
                <div class="space-y-6">
                  <UFormField :label="t('settings.profile.name')" required>
                    <UInput class="w-full" placeholder="John Doe" />
                  </UFormField>
                  <UFormField :label="t('settings.profile.email')" required>
                    <UInput type="email" class="w-full" placeholder="john@example.com" />
                  </UFormField>
                  <USeparator />
                  <div class="flex justify-end">
                    <UButton :label="t('common.save')" color="primary" />
                  </div>
                </div>
              </UCard>
            </div>

          </div>
          <div v-else>
            <!-- Fallback content -->
            <UCard>
              <p class="text-center text-neutral-500">No content found for active tab: {{ activeTabKey }}</p>
            </UCard>
          </div>
        </main>
      </div>
    </div>
  </div>

    <!-- Integration Drawers (Modals) -->
    <!-- Twilio WhatsApp Drawer -->
    <UModal v-model:open="drawersState.twilio_whatsapp" :title="t('settings.integrations.twilio_whatsapp.title')" :description="t('settings.integrations.twilio_whatsapp.drawer_desc')">
      <template #body>
        <div class="space-y-6">
          <UFormField :label="t('settings.fields.account_sid')" required>
            <UInput v-model="integrationsFormState.twilio_whatsapp.account_sid" class="w-full" :placeholder="t('settings.fields.account_sid_placeholder', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')" />
          </UFormField>
          <UFormField :label="t('settings.fields.auth_token')" required>
            <UInput v-model="integrationsFormState.twilio_whatsapp.auth_token" type="password" class="w-full" :placeholder="t('settings.fields.auth_token_placeholder', '••••••••••••••••••••••••••••••••')" />
          </UFormField>
          <UFormField :label="t('settings.fields.phone_number')" required :description="t('settings.fields.phone_number_desc')">
            <UInput v-model="integrationsFormState.twilio_whatsapp.phone_number" class="w-full" :placeholder="t('settings.fields.phone_number_placeholder', '+1234567890')" />
          </UFormField>
          
          <USeparator />
          
          <div class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg space-y-2">
            <h4 class="text-sm font-semibold">{{ t('settings.integrations.webhook_url') }}</h4>
            <p class="text-xs text-neutral-500">{{ t('settings.integrations.webhook_url_desc') }}</p>
            <div class="flex items-center gap-2">
              <UInput readonly value="https://api.brandi.digital/webhooks/twilio/whatsapp" class="flex-1 w-full" />
              <UButton icon="i-heroicons-clipboard" variant="ghost" color="neutral" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="drawersState.twilio_whatsapp = false" />
          <UButton :label="t('common.save')" color="primary" @click="dispatchAction('settings.integrations.twilio_whatsapp.save')" :loading="isSaving" />
        </div>
      </template>
    </UModal>

    <!-- Email SMTP Drawer -->
    <UModal v-model:open="drawersState.email_smtp" :title="t('settings.integrations.email_smtp.title', 'SMTP Configuration')" :description="t('settings.integrations.email_smtp.description', 'Configure your outgoing email server settings.')">
      <template #body>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField :label="t('settings.fields.smtp_host')" required>
              <UInput v-model="integrationsFormState.email_smtp.host" class="w-full" placeholder="smtp.gmail.com" />
            </UFormField>
            <UFormField :label="t('settings.fields.smtp_port')" required>
              <UInput v-model="integrationsFormState.email_smtp.port" type="number" class="w-full" />
            </UFormField>
          </div>
          <UFormField :label="t('settings.fields.smtp_user')" required>
            <UInput v-model="integrationsFormState.email_smtp.user" class="w-full" />
          </UFormField>
          <UFormField :label="t('settings.fields.smtp_pass')" required>
            <UInput v-model="integrationsFormState.email_smtp.pass" type="password" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton :label="t('settings.integrations.email_smtp.test')" color="neutral" variant="outline" />
          <UButton :label="t('common.save')" color="primary" @click="dispatchAction('settings.integrations.email_smtp.save')" :loading="isSaving" />
        </div>
      </template>
    </UModal>

    <!-- Confirmation Modal -->
    <UModal
      v-model:open="confirmationState.open"
      :title="confirmationState.title"
      :description="confirmationState.description"
    >
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="confirmationState.open = false" />
          <UButton :label="t('common.confirm', 'Confirm')" color="error" @click="confirmationState.onConfirm" />
        </div>
      </template>
    </UModal>

</template>
