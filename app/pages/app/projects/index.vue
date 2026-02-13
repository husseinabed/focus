<template>
  <div class="flex flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
      <UButton label="Create Project" icon="i-lucide-plus" to="/app/projects/new" />
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500">Total Projects</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500">Active</span>
          <span class="text-2xl font-bold text-green-600">{{ stats.active }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500">Draft</span>
          <span class="text-2xl font-bold text-orange-600">{{ stats.draft }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500">Archived</span>
          <span class="text-2xl font-bold text-gray-500">{{ stats.archived }}</span>
        </div>
      </UCard>
    </div>

    <!-- Filters & Table -->
    <UCard :ui="{ body: { padding: '' } }">
      <div class="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-800 sm:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search projects..."
          class="w-full sm:w-64"
        />
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Status"
          class="w-full sm:w-40"
        />
        <USelect
          v-model="repoFilter"
          :items="booleanOptions"
          placeholder="Repository"
          class="w-full sm:w-40"
        />
        <USelect
          v-model="vercelFilter"
          :items="booleanOptions"
          placeholder="Vercel"
          class="w-full sm:w-40"
        />
        <div class="flex-1"></div>
        <UButton
          v-if="hasActiveFilters"
          color="neutral"
          variant="ghost"
          label="Reset"
          icon="i-lucide-x"
          @click="resetFilters"
        />
      </div>

      <UTable
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
        class="w-full"
      />

      <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
        <span class="text-sm text-gray-500">
          Showing {{ (page - 1) * pageCount + 1 }} to {{ Math.min(page * pageCount, totalCount) }} of {{ totalCount }} results
        </span>
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="totalCount"
        />
      </div>
    </UCard>

    <!-- Delete Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Delete Project">
      <template #body>
        <p>Are you sure you want to delete <strong>{{ projectToDelete?.name }}</strong>? This action cannot be undone.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="isDeleteModalOpen = false" />
          <UButton label="Delete" color="error" :loading="isDeleting" @click="confirmDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import type { Project } from '~/types/projects'
import { UBadge, UButton, UDropdownMenu } from '#components'

definePageMeta({
  layout: 'app'
})

// --- State ---
const search = ref('')
const statusFilter = ref<string | undefined>(undefined)
const repoFilter = ref<string | undefined>(undefined)
const vercelFilter = ref<string | undefined>(undefined)

const page = ref(1)
const pageCount = ref(10)
const sort = ref({ column: 'updated_at', direction: 'desc' })

const isDeleteModalOpen = ref(false)
const isDeleting = ref(false)
const projectToDelete = ref<Project | null>(null)

// --- Options ---
const statusOptions = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' }
]

const booleanOptions = [
  { label: 'All', value: undefined },
  { label: 'Linked', value: 'true' },
  { label: 'Unlinked', value: 'false' }
]

// --- Data Fetching ---
const query = computed(() => ({
  q: search.value,
  status: statusFilter.value,
  has_repo: repoFilter.value,
  has_vercel: vercelFilter.value,
  sort: `${sort.value.column} ${sort.value.direction}`,
  page: page.value,
  pageSize: pageCount.value
}))

const { data, status, refresh } = await useFetch('/api/projects', {
  query,
  watch: [query]
})

const rows = computed(() => data.value?.data || [])
const totalCount = computed(() => data.value?.count || 0)
const stats = computed(() => data.value?.counts || { total: 0, active: 0, draft: 0, archived: 0 })

const hasActiveFilters = computed(() => {
  return !!search.value || !!statusFilter.value || !!repoFilter.value || !!vercelFilter.value
})

function resetFilters() {
  search.value = ''
  statusFilter.value = undefined
  repoFilter.value = undefined
  vercelFilter.value = undefined
  page.value = 1
}

// --- Actions ---
const handleDuplicate = async (project: Project) => {
  try {
    await $fetch(`/api/projects/${project.id}/duplicate`, { method: 'POST' })
    refresh()
  } catch (error) {
    console.error('Failed to duplicate project', error)
  }
}

const handleArchive = async (project: Project) => {
  try {
    await $fetch(`/api/projects/${project.id}/toggle-archive`, { method: 'POST' })
    refresh()
  } catch (error) {
    console.error('Failed to toggle archive', error)
  }
}

const handleDelete = (project: Project) => {
  projectToDelete.value = project
  isDeleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!projectToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/projects/${projectToDelete.value.id}`, { method: 'DELETE' })
    isDeleteModalOpen.value = false
    projectToDelete.value = null
    refresh()
  } catch (error) {
    console.error('Failed to delete project', error)
  } finally {
    isDeleting.value = false
  }
}

// --- Columns ---
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(new Date(dateString))
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Project',
    cell: ({ row }: { row: { original: Project } }) => h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.original.name),
      row.original.description ? h('span', { class: 'text-gray-500 text-xs truncate max-w-[300px]' }, row.original.description) : null
    ])
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: { row: { original: Project } }) => h(UBadge, {
      color: row.original.status === 'active' ? 'green' : row.original.status === 'draft' ? 'orange' : 'neutral',
      variant: 'subtle',
      label: row.original.status
    })
  },
  {
    accessorKey: 'repo',
    header: 'Repository',
    cell: ({ row }: { row: { original: Project } }) => row.original.repo 
      ? h(UButton, { 
          icon: 'i-simple-icons-github', 
          variant: 'link', 
          to: row.original.repo, 
          target: '_blank',
          padded: false,
          color: 'neutral'
        })
      : h('span', { class: 'text-gray-400' }, '-')
  },
  {
    accessorKey: 'vercel_id',
    header: 'Deployment',
    cell: ({ row }: { row: { original: Project } }) => row.original.vercel_id
      ? h(UButton, {
          icon: 'i-simple-icons-vercel',
          variant: 'link',
          color: 'neutral',
          padded: false
        })
      : h('span', { class: 'text-gray-400' }, '-')
  },
  {
    accessorKey: 'updated_at',
    header: 'Last Updated',
    cell: ({ row }: { row: { original: Project } }) => formatDate(row.original.updated_at)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: { row: { original: Project } }) => h(UDropdownMenu, {
      items: [
        [{
          label: 'Edit',
          icon: 'i-lucide-edit',
          to: `/app/projects/${row.original.id}/edit`
        }, {
          label: 'Duplicate',
          icon: 'i-lucide-copy',
          onSelect: () => handleDuplicate(row.original)
        }],
        [{
          label: row.original.status === 'archived' ? 'Unarchive' : 'Archive',
          icon: 'i-lucide-archive',
          onSelect: () => handleArchive(row.original)
        }],
        [{
          label: 'Delete',
          icon: 'i-lucide-trash',
          color: 'error',
          onSelect: () => handleDelete(row.original)
        }]
      ]
    }, () => h(UButton, {
      icon: 'i-lucide-more-horizontal',
      color: 'neutral',
      variant: 'ghost'
    }))
  }
]
</script>
