<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()
const { activeMembership, memberships } = storeToRefs(workspaceStore)
const { t } = useI18n()
 

const items = computed(() => {
  const workspaceItems = memberships.value.map((m) => ({
    label: m.workspace?.name || 'Unknown Workspace',
    icon: m.workspace_id === activeMembership.value?.workspace_id ? 'i-heroicons-check' : undefined,
    onSelect: () => {
      workspaceStore.setActiveWorkspace(m.workspace_id)
    }
  }))

  return [workspaceItems]
})

const currentWorkspaceName = computed(() => {
  return activeMembership.value?.workspace?.name || t('common.select_workspace')
})
</script>

<template>
  <UDropdownMenu :items="items" >
    <UButton
      color="neutral"
      variant="ghost"
      class="w-full flex items-center justify-between px-2 py-2"
    >
      <div class="flex items-center gap-2 truncate">
        <div class="h-6 w-6 rounded bg-[--color-brand-500] shrink-0" />
        <span class="truncate font-semibold text-[--text-primary]">{{ currentWorkspaceName }}</span>
      </div>
      <UIcon name="i-heroicons-chevron-down-20-solid" class="w-5 h-5 text-gray-400 shrink-0" />
    </UButton>
  </UDropdownMenu>
</template>
