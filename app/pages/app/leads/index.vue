<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { ColumnDef } from '@tanstack/table-core'
import type { Lead } from '~/types/leads'

definePageMeta({
  layout: 'app'
})

const { t, locale } = useI18n()
const { leads, pending, error, refresh, total, filters, sort, page, pageCount, aggregatedCounts } = useLeads()

 
// Layout & UI State
const isRtl = computed(() => locale.value === 'he' || locale.value === 'ar')
const ui = reactive({
  density: 'compact' as 'compact' | 'comfortable',
  filterDrawerOpen: false
})

// Selection
const selectedIds = ref<Record<string, boolean>>({})
const selectedLeads = computed(() => {
  if (!leads.value) return []
  return leads.value.filter(lead => lead.id && selectedIds.value[lead.id])
})

// Options
const statusOptions = [
  { label: t('leads.status.new'), value: 'new' },
  { label: t('leads.status.contacted'), value: 'contacted' },
  { label: t('leads.status.qualified'), value: 'qualified' },
  { label: t('leads.status.proposal'), value: 'proposal' },
  { label: t('leads.status.won'), value: 'won' },
  { label: t('leads.status.lost'), value: 'lost' }
]

const sourceOptions = [
  { label: t('leads.sources.manual'), value: 'manual' },
  { label: t('leads.sources.import'), value: 'import' },
  { label: t('leads.sources.google_maps'), value: 'google_maps' },
  { label: t('leads.sources.whatsapp_inbound'), value: 'whatsapp_inbound' }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Auto', value: 'auto' }
]

const sortOptions = [
  { label: t('leads.sort.newest'), value: 'created_at desc' },
  { label: t('leads.sort.oldest'), value: 'created_at asc' },
  { label: t('leads.sort.last_activity'), value: 'last_activity desc' }
]

const densityOptions = [
  { label: t('common.compact'), value: 'compact' },
  { label: t('common.comfortable'), value: 'comfortable' }
]

const bulkActions = [[
  { label: t('leads.actions.export_selected'), icon: 'i-heroicons-arrow-down-tray', onSelect: () => console.log('Export', selectedLeads.value) },
  { label: t('leads.actions.delete_selected'), icon: 'i-heroicons-trash', onSelect: () => console.log('Delete', selectedLeads.value) }
]]

// Computed Props
const hasActiveFilters = computed(() => {
  return !!(filters.q || filters.status || filters.source || filters.language || filters.city || filters.has_website || filters.has_phone)
})
const totalPages = computed(() => Math.ceil(total.value / pageCount.value))

// Actions
function clearFilters() {
  filters.q = ''
  filters.status = undefined
  filters.source = undefined
  filters.language = undefined
  filters.city = ''
  filters.has_website = false
  filters.has_phone = false
}

function onRowClick(row: Lead) {
  if (row.id) {
    navigateTo(`/app/leads/${row.id}`)
  }
}

// Columns
const LeadIdentityCellComp = resolveComponent('LeadIdentityCell')
const StatusBadgeCellComp = resolveComponent('StatusBadgeCell')
const PhoneActionsCellComp = resolveComponent('PhoneActionsCell')
const BadgeCellComp = resolveComponent('BadgeCell')
const LanguageCellComp = resolveComponent('LanguageCell')
const TimeAgoCellComp = resolveComponent('TimeAgoCell')
const UDropdownComp = resolveComponent('UDropdownMenu')
const UButtonComp = resolveComponent('UButton')

const columns = computed<ColumnDef<Lead>[]>(() => [
  {
    id: 'lead',
    accessorKey: 'full_name',
    header: t('leads.columns.lead'),
    cell: ({ row }) => h(LeadIdentityCellComp, { row: row.original })
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: t('leads.columns.status'),
    cell: ({ row }) => h(StatusBadgeCellComp, { row: row.original })
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: t('leads.columns.phone'),
    cell: ({ row }) => h(PhoneActionsCellComp, { row: row.original })
  },
  {
    id: 'source',
    accessorKey: 'source',
    header: t('leads.columns.source'),
    cell: ({ row }) => h(BadgeCellComp, { value: row.original.source })
  },
  {
    id: 'language',
    accessorKey: 'language',
    header: t('leads.columns.language'),
    cell: ({ row }) => h(LanguageCellComp, { value: row.original.language })
  },
  {
    id: 'last_activity',
    accessorKey: 'last_activity',
    header: t('leads.columns.last_activity'),
    cell: ({ row }) => h(TimeAgoCellComp, { value: row.original.last_activity })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        UDropdownComp,
        { items: rowActions(row.original) },
        {
          default: () =>
            h(UButtonComp, {
              icon: 'i-heroicons-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              'data-stop-row': ''
            })
        }
      )
  }
])

const rowActions = (row: Lead) => [[
  { label: t('common.view'), icon: 'i-heroicons-eye', onSelect: () => onRowClick(row) },
  { label: t('common.edit'), icon: 'i-heroicons-pencil-square', onSelect: () => navigateTo(`/app/leads/${row.id}/edit`) }
]]

const statsChips = computed(() => [
  { key: 'total', label: `${aggregatedCounts.value.total ?? 0} ${t('leads.stats.total')}`, color: 'neutral' },
  { key: 'new', label: `${aggregatedCounts.value.new ?? 0} ${t('leads.stats.new')}`, color: 'blue' },
  { key: 'pending', label: `${aggregatedCounts.value.pending_approval ?? 0} ${t('leads.stats.pending_approval')}`, color: 'yellow' },
  { key: 'replied_today', label: `${aggregatedCounts.value.replied_today ?? 0} ${t('leads.stats.replied_today')}`, color: 'green' }
])

onBeforeMount(async () => {
  await refresh()
})
</script>

<template>
  <UContainer>
    <!-- 1. Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          {{ t('leads.title') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('leads.subtitle') }}
        </p>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          <UBadge v-for="chip in statsChips" :key="chip.key" :color="chip.color" variant="subtle" :label="chip.label" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton :label="t('leads.actions.new')" icon="i-heroicons-plus" to="/app/leads/new" color="primary" />
        <UButton :label="t('leads.actions.scrape')" icon="i-heroicons-globe-alt" to="/app/leads/scrape" color="neutral" variant="outline" class="hidden sm:inline-flex" />
        <UButton :label="t('leads.actions.import')" icon="i-heroicons-document-arrow-up" to="/app/leads/import" color="neutral" variant="outline" class="hidden sm:inline-flex" />
        <UButton icon="i-heroicons-funnel" color="neutral" variant="ghost" class="lg:hidden" @click="ui.filterDrawerOpen = true" />
      </div>
    </div>

    <!-- 2. Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <!-- 2a. Filter Sidebar (Desktop) -->
      <aside class="hidden lg:block sticky top-4 h-fit">
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ t('leads.filters.title') }}</h3>
          </template>
          <div class="space-y-4">
            <UFormField :label="t('leads.filters.search')">
              <UInput v-model="filters.q" icon="i-heroicons-magnifying-glass" :debounce="500" class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.status')">
              <USelectMenu v-model="filters.status" :items="statusOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.source')">
              <USelectMenu v-model="filters.source" :items="sourceOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.language')">
              <USelectMenu v-model="filters.language" :items="languageOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.city')">
              <UInput v-model="filters.city" icon="i-heroicons-map-pin" class="w-full" />
            </UFormField>
            <UFormField>
              <UCheckbox v-model="filters.has_website" :label="t('leads.filters.has_website')" />
              <UCheckbox v-model="filters.has_phone" :label="t('leads.filters.has_phone')" />
            </UFormField>
            <div v-if="hasActiveFilters" class="pt-2">
              <UButton :label="t('common.clear_filters')" color="neutral" variant="soft" block @click="clearFilters" />
            </div>
          </div>
        </UCard>
      </aside>

      <!-- 2b. Main Content -->
      <main>
        <UCard>
          <!-- Table Toolbar -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2 h-8">
               <UDropdownMenu v-if="selectedLeads.length > 0" :items="bulkActions">
                  <UButton color="neutral" variant="soft" trailing-icon="i-heroicons-chevron-down">
                    {{ selectedLeads.length }} {{ t('leads.selected') }}
                  </UButton>
                </UDropdownMenu>
            </div>
            <div class="flex items-center gap-2">
              <USelectMenu v-model="sort" :items="sortOptions" option-attribute="label" value-attribute="value" size="sm" class="w-full sm:w-[220px]" />
              <USelectMenu v-model="ui.density" :items="densityOptions" option-attribute="label" value-attribute="value" size="sm" class="w-full sm:w-44" />
            </div>
          </div>

          <!-- Table -->
          <UTable
            v-model:row-selection="selectedIds"
            :columns="columns"
            :data="leads"
            :loading="pending"
            :ui="{ td: { padding: ui.density === 'compact' ? 'py-2' : 'py-4' } }"
            sticky-header
            row-key="id"
            @row-click="onRowClick"
            :row-click-stoppable-selectors="['button', 'a', '[data-stop-row]']"
          >
          </UTable>

          <!-- Table Footer -->
          <template #footer>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span class="text-sm text-gray-500">
                {{ t('common.showing') }} {{ leads?.length ?? 0 }} / {{ total }}
              </span>
              <UPagination v-if="totalPages > 1" v-model="page" :page-count="totalPages" :total="total" />
            </div>
          </template>
        </UCard>
      </main>
    </div>

    <!-- 3. Mobile Filter Drawer -->
    <UDrawer v-model:open="ui.filterDrawerOpen" :dir="isRtl ? 'left' : 'right'">
      <template #content>
        <UCard class="flex flex-col h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ t('leads.filters.title') }}</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="ui.filterDrawerOpen = false" />
            </div>
          </template>
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <UFormField :label="t('leads.filters.search')">
              <UInput v-model="filters.q" icon="i-heroicons-magnifying-glass" class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.status')">
              <USelectMenu v-model="filters.status" :items="statusOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.source')">
              <USelectMenu v-model="filters.source" :items="sourceOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.language')">
              <USelectMenu v-model="filters.language" :items="languageOptions" option-attribute="label" value-attribute="value" clearable class="w-full" />
            </UFormField>
            <UFormField :label="t('leads.filters.city')">
              <UInput v-model="filters.city" icon="i-heroicons-map-pin" class="w-full" />
            </UFormField>
            <UFormField>
              <UCheckbox v-model="filters.has_website" :label="t('leads.filters.has_website')" />
              <UCheckbox v-model="filters.has_phone" :label="t('leads.filters.has_phone')" />
            </UFormField>
          </div>
          <template #footer>
            <div class="flex gap-2 p-4">
              <UButton v-if="hasActiveFilters" :label="t('common.clear_filters')" color="neutral" variant="soft" class="flex-1" @click="clearFilters" />
              <UButton :label="t('common.apply')" color="primary" class="flex-1" @click="ui.filterDrawerOpen = false" />
            </div>
          </template>
        </UCard>
      </template>
    </UDrawer>
  </UContainer>
</template>
