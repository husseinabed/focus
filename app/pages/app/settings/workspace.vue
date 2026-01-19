<script setup lang="ts">
import { z } from 'zod'
import { useWorkspaceStore } from '~~/stores/workspace'

// Schema for form validation
const formSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string().optional(),
  default_locale: z.enum(['en', 'he', 'ar']),
  timezone: z.string(),
  brand_color: z.string().optional(),
})

type FormInput = z.infer<typeof formSchema>

const inviteFormSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type InviteFormInput = z.infer<typeof inviteFormSchema>

const workspaceStore = useWorkspaceStore()
const toast = useToast()
const { t } = useI18n()
const client = useSupabaseClient()
const user = useSupabaseUser()

const workspace = ref<any>(null)
const form = ref<FormInput | null>(null)
const inviteForm = ref<InviteFormInput>({ email: '' })
const isOwnerOrAdmin = ref(false)
const loading = ref(true)
const isInviteModalOpen = ref(false)

// Timezones for the select input
const timezones = [
  'Asia/Jerusalem',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const memberColumns = [
  { key: 'name', label: t('settings.workspace.member_name_column'), sortable: true },
  { key: 'email', label: t('settings.workspace.member_email_column'), sortable: true },
  { key: 'role', label: t('settings.workspace.member_role_column'), sortable: true },
  { key: 'actions', label: t('common.actions') },
]

const fetchWorkspaceData = async () => {
  if (!workspaceStore.activeWorkspaceId) {
    toast.add({ title: t('common.error'), description: t('settings.workspace.no_active_workspace'), color: 'red' })
    loading.value = false
    return
  }

  try {
    const { data, error } = await client
      .from('workspaces')
      .select(
        `*,
        workspace_members(profile:profiles(*), role)
      `
      )
      .eq('id', workspaceStore.activeWorkspaceId)
      .single()

    if (error) throw error
    if (data) {
      workspace.value = data
      form.value = {
        name: data.name,
        slug: data.slug,
        default_locale: data.default_locale || 'en',
        timezone: data.timezone || 'Asia/Jerusalem',
        brand_color: data.brand_color,
      }
      checkUserRole()
    }
  } catch (error: any) {
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const checkUserRole = () => {
  const member = workspace.value?.workspace_members.find(
    (m: any) => m.profile?.id === user.value?.id
  )
  if (member) {
    isOwnerOrAdmin.value = member.role === 'owner' || member.role === 'admin'
  }
}

const handleSubmit = async () => {
  if (!form.value || !workspace.value) return

  try {
    const parsedForm = formSchema.parse(form.value)

    const { error } = await client
      .from('workspaces')
      .update({
        name: parsedForm.name,
        default_locale: parsedForm.default_locale,
        timezone: parsedForm.timezone,
        brand_color: parsedForm.brand_color,
      })
      .eq('id', workspace.value.id)

    if (error) throw error
    toast.add({ title: t('common.success'), description: t('settings.workspace.update_success'), color: 'green' })
    fetchWorkspaceData() // Re-fetch to update UI
  } catch (error: any) {
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
  }
}

const updateMemberRole = async (memberProfileId: string, newRole: string) => {
  if (!isOwnerOrAdmin.value || !workspace.value) return
  if (memberProfileId === user.value?.id) {
    toast.add({ title: t('common.error'), description: t('settings.workspace.cannot_change_own_role'), color: 'red' })
    return
  }
  try {
    const { error } = await client
      .from('workspace_members')
      .update({ role: newRole })
      .eq('workspace_id', workspace.value.id)
      .eq('profile_id', memberProfileId)

    if (error) throw error
    toast.add({ title: t('common.success'), description: t('settings.workspace.role_update_success'), color: 'green' })
    fetchWorkspaceData()
  } catch (error: any) {
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
  }
}

const removeMember = async (memberProfileId: string) => {
  if (!isOwnerOrAdmin.value || !workspace.value) return
  if (memberProfileId === user.value?.id) {
    toast.add({ title: t('common.error'), description: t('settings.workspace.cannot_remove_self'), color: 'red' })
    return
  }
  try {
    const { error } = await client
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspace.value.id)
      .eq('profile_id', memberProfileId)

    if (error) throw error
    toast.add({ title: t('common.success'), description: t('settings.workspace.member_remove_success'), color: 'green' })
    fetchWorkspaceData()
  } catch (error: any) {
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
  }
}

const sendInvite = async () => {
  if (!inviteForm.value.email || !workspace.value) return
  try {
    const parsedForm = inviteFormSchema.parse(inviteForm.value)
    // In a real application, you would call a server API to send the invitation email
    // For now, we'll just simulate it and clear the form
    console.log(`Sending invite to ${parsedForm.email} for workspace ${workspace.value.id}`)
    toast.add({ title: t('common.success'), description: t('settings.workspace.invite_send_success', { email: parsedForm.email }), color: 'green' })
    inviteForm.value.email = ''
    isInviteModalOpen.value = false
  } catch (error: any) {
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
  }
}

onMounted(() => {
  fetchWorkspaceData()
})
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-semibold mb-4">{{ $t('settings.workspace.title') }}</h1>
    <USeparator class="mb-6" />

    <!-- Workspace Info Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">{{ $t('settings.workspace.info_section_title') }}</h2>
      <UCard v-if="!loading && form">
        <UForm :schema="formSchema" :state="form" class="space-y-4" @submit="handleSubmit">
          <UFormField
            :label="$t('settings.workspace.name_label')"
            name="name"
            :hint="$t('settings.workspace.name_hint')"
            :error="formSchema.safeParse(form).error?.issues.find(i => i.path[0] === 'name')?.message"
          >
            <UInput v-model="form.name" :disabled="!isOwnerOrAdmin" class="w-full" />
          </UFormField>

          <UFormField
            :label="$t('settings.workspace.slug_label')"
            name="slug"
            :hint="$t('settings.workspace.slug_hint')"
            :error="formSchema.safeParse(form).error?.issues.find(i => i.path[0] === 'slug')?.message"
          >
            <UInput v-model="form.slug" disabled class="w-full" />
          </UFormField>

          <UFormField
            :label="$t('settings.workspace.default_locale_label')"
            name="default_locale"
            :hint="$t('settings.workspace.default_locale_hint')"
            :error="formSchema.safeParse(form).error?.issues.find(i => i.path[0] === 'default_locale')?.message"
          >
            <USelect
              v-model="form.default_locale"
              :items="['en', 'he', 'ar']"
              :disabled="!isOwnerOrAdmin"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('settings.workspace.timezone_label')"
            name="timezone"
            :hint="$t('settings.workspace.timezone_hint')"
            :error="formSchema.safeParse(form).error?.issues.find(i => i.path[0] === 'timezone')?.message"
          >
            <USelect
              v-model="form.timezone"
              :items="timezones"
              :disabled="!isOwnerOrAdmin"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="$t('settings.workspace.brand_color_label')"
            name="brand_color"
            :hint="$t('settings.workspace.brand_color_hint')"
            :error="formSchema.safeParse(form).error?.issues.find(i => i.path[0] === 'brand_color')?.message"
          >
            <UInput v-model="form.brand_color" :disabled="!isOwnerOrAdmin" class="w-full" />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            :disabled="!isOwnerOrAdmin || !formSchema.safeParse(form).success"
          >
            {{ $t('common.save_changes') }}
          </UButton>
        </UForm>
      </UCard>
      <div v-else-if="loading">
        <p>{{ $t('common.loading') }}</p>
      </div>
      <div v-else>
        <p>{{ $t('settings.workspace.no_workspace_data') }}</p>
      </div>
    </section>

    <!-- Members Section -->
    <section>
      <h2 class="text-xl font-semibold mb-4">{{ $t('settings.workspace.members_section_title') }}</h2>
      <UCard>
        <div class="flex justify-end mb-4">
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            @click="isInviteModalOpen = true"
            :disabled="!isOwnerOrAdmin"
          >
            {{ $t('settings.workspace.invite') }}
          </UButton>
        </div>

        <UTable
          :rows="workspace?.workspace_members || []"
          :columns="memberColumns"
          :empty-state="{ icon: 'i-heroicons-user-group', label: $t('settings.workspace.no_members') }"
        >
          <template #name-data="{ row }">
            {{ row.profile?.full_name || row.profile?.email }}
          </template>
          <template #email-data="{ row }">
            {{ row.profile?.email }}
          </template>
          <template #role-data="{ row }">
            <USelect
              v-model="row.role"
              :items="[`owner`, `admin`, `member`]"
              :disabled="!isOwnerOrAdmin || row.profile?.id === user?.id"
              @change="updateMemberRole(row.profile?.id, row.role)"
              class="w-full"
            />
          </template>
          <template #actions-data="{ row }">
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              :disabled="!isOwnerOrAdmin || row.profile?.id === user?.id"
              @click="removeMember(row.profile?.id)"
            />
          </template>
        </UTable>
      </UCard>
    </section>

    <!-- Invite Member Modal -->
    <UModal v-model="isInviteModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ $t('settings.workspace.invite_modal_title') }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isInviteModalOpen = false" />
          </div>
        </template>

        <UForm :schema="inviteFormSchema" :state="inviteForm" class="space-y-4" @submit="sendInvite">
          <UFormField
            :label="$t('settings.workspace.invite_email_label')"
            name="email"
            :hint="$t('settings.workspace.invite_email_hint')"
            :error="inviteFormSchema.safeParse(inviteForm).error?.issues.find(i => i.path[0] === 'email')?.message"
          >
            <UInput v-model="inviteForm.email" class="w-full" />
          </UFormField>

          <UButton type="submit" color="primary" :disabled="!inviteFormSchema.safeParse(inviteForm).success">
            {{ $t('settings.workspace.send_invite') }}
          </UButton>
        </UForm>
      </UCard>
    </UModal>
  </UContainer>
</template>

<style scoped>
/* Component specific styles */
</style>
