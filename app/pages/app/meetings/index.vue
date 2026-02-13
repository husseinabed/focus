<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { Meeting } from '~/types/meetings'
import { LeadIdentityCell } from '#components'
import MeetingTypeBadge from '~/components/meetings/MeetingTypeBadge.vue'
import MeetingStatusChip from '~/components/meetings/MeetingStatusChip.vue'

definePageMeta({
  layout: 'app'
})

const { t } = useI18n()
const toast = useToast()

// Filter State
const filters = ref({
  status: 'scheduled', // 'upcoming' in requirements, 'scheduled' in DB
  type: 'all',
  date_range: null as Date[] | null,
  owner: 'all',
  q: ''
})

// Options
const statusItems = [
  { label: t('meetings.filters.upcoming'), value: 'scheduled' },
  { label: t('meetings.filters.completed'), value: 'completed' },
  { label: t('meetings.filters.canceled'), value: 'canceled' }
]

const typeItems = [
  { label: t('meetings.filters.intro'), value: 'qualification' },
  { label: t('meetings.filters.proposal'), value: 'proposal' },
  { label: t('meetings.filters.followup'), value: 'followup' }
]

// Tone Helpers
const toneHelpers = {
  tone: {
    channel: (channel: string) => {
      switch (channel) {
        case 'zoom': return 'blue'
        case 'google_meet': return 'green'
        case 'manual': return 'neutral'
        default: return 'neutral'
      }
    },
    status: (status: string) => {
      switch (status) {
        case 'scheduled': return 'blue'
        case 'completed': return 'green'
        case 'canceled': return 'red'
        case 'no_show': return 'neutral'
        default: return 'neutral'
      }
    }
  }
}

// Data Fetching
const { data, pending, refresh } = useFetch('/api/meetings', {
  query: computed(() => ({
    status: filters.value.status !== 'all' ? filters.value.status : undefined,
    type: filters.value.type !== 'all' ? filters.value.type : undefined,
    q: filters.value.q || undefined,
    date_range: filters.value.date_range && filters.value.date_range.length === 2
      ? `${filters.value.date_range[0].toISOString()},${filters.value.date_range[1].toISOString()}`
      : undefined
  })),
  transform: (res: any) => ({
    meetings: res.meetings || [],
    total: res.total || 0
  }),
  default: () => ({ meetings: [], total: 0 })
})

// Table Columns
const columns = ref([
  {
    accessorKey: 'lead',
    header: t('meetings.table.columns.lead'),
    cell: ({ row }: any) => {
      const lead = row.original.leads
      return h(LeadIdentityCell, { 
        row: { 
          full_name: lead?.name, 
          company_name: lead?.company 
        } 
      })
    }
  },
  {
    accessorKey: 'type',
    header: t('meetings.table.columns.type'),
    cell: ({ row }: any) => h(MeetingTypeBadge, { type: row.original.type })
  },
  {
    accessorKey: 'start_time',
    header: t('meetings.table.columns.scheduled_at'),
    cell: ({ row }: any) => {
      const date = new Date(row.original.start_time)
      return h('span', { class: 'text-sm' }, date.toLocaleString())
    }
  },
  {
    accessorKey: 'duration',
    header: t('meetings.table.columns.duration'),
    cell: ({ row }: any) => {
      const start = new Date(row.original.start_time)
      const end = new Date(row.original.end_time)
      const durationMs = end.getTime() - start.getTime()
      const durationMin = Math.round(durationMs / 60000)
      return h('span', { class: 'text-sm' }, `${durationMin} min`)
    }
  },
  {
    accessorKey: 'provider',
    header: t('meetings.table.columns.channel'),
    cell: ({ row }: any) => {
      const provider = row.original.provider
      const UBadge = resolveComponent('UBadge')
      return h(UBadge, {
        label: provider,
        color: toneHelpers.tone.channel(provider),
        variant: 'subtle',
        class: 'capitalize'
      })
    }
  },
  {
    accessorKey: 'status',
    header: t('meetings.table.columns.status'),
    cell: ({ row }: any) => h(MeetingStatusChip, { status: row.original.status })
  },
  {
    id: 'actions',
    cell: ({ row }: any) => {
      const meeting = row.original
      const UDropdownMenu = resolveComponent('UDropdownMenu')
      const UButton = resolveComponent('UButton')
      
      const items = [
        [
          {
            label: t('meetings.table.row_actions.open'),
            icon: 'i-lucide-external-link',
            to: `/app/meetings/${meeting.id}`
          },
          {
            label: t('meetings.table.row_actions.join'),
            icon: 'i-lucide-video',
            disabled: meeting.status !== 'scheduled' || !meeting.meeting_url,
            onSelect: () => {
              if (meeting.meeting_url) window.open(meeting.meeting_url, '_blank')
            }
          }
        ],
        [
          {
            label: t('meetings.table.row_actions.reschedule'),
            icon: 'i-lucide-calendar-days',
            to: `/app/meetings/${meeting.id}/edit`
          },
          {
            label: t('meetings.table.row_actions.cancel'),
            icon: 'i-lucide-trash',
            color: 'red' as const,
            disabled: meeting.status !== 'scheduled',
            onSelect: () => handleCancel(meeting.id)
          }
        ]
      ]

      return h(UDropdownMenu, { items }, () => h(UButton, {
        icon: 'i-lucide-more-vertical',
        color: 'neutral',
        variant: 'ghost'
      }))
    }
  }
])

async function handleCancel(id: string) {
  try {
    await $fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      body: { status: 'canceled' }
    })
    toast.add({
      title: 'Meeting canceled',
      color: 'success'
    })
    refresh()
  } catch (err: any) {
    toast.add({
      title: 'Error canceling meeting',
      description: err.message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UMain>
    <UContainer>
      <div class="lg:grid lg:grid-cols-[260px_1fr] gap-16">
        <!-- Sidebar Filters -->
        <aside class="space-y-6">
          <div class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold">{{ t('meetings.filters.title') || t('ui.approvals.index.v1.filters.heading') }}</h2>
            
            <UFormField :label="t('meetings.filters.status')">
              <USelect
                v-model="filters.status"
                :items="statusItems"
                class="w-full"
                color="neutral"
              />
            </UFormField>

            <UFormField :label="t('meetings.filters.type')">
              <USelect
                v-model="filters.type"
                :items="[{ label: 'All', value: 'all' }, ...typeItems]"
                class="w-full"
                color="neutral"
              />
            </UFormField>

            <UFormField :label="t('meetings.filters.date')">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  icon="i-lucide-calendar"
                  class="w-full"
                  color="neutral"
                  variant="subtle"
                  :label="filters.date_range && filters.date_range.length === 2 ? `${filters.date_range[0].toLocaleDateString()} - ${filters.date_range[1].toLocaleDateString()}` : t('meetings.filters.date')"
                />
                <template #content>
                  <DatePicker v-model="filters.date_range" />
                </template>
              </UPopover>
            </UFormField>

            <UFormField :label="t('meetings.filters.owner')">
              <USelect
                v-model="filters.owner"
                :items="[{ label: 'All Owners', value: 'all' }]"
                class="w-full"
                color="neutral"
                disabled
              />
            </UFormField>

            <USeparator />

            <UButton
              color="neutral"
              variant="subtle"
              block
              @click="filters = { status: 'scheduled', type: 'all', date_range: null, owner: 'all', q: '' }"
            >
              Reset Filters
            </UButton>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="space-y-6 mt-8 lg:mt-0">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('meetings.title') }}</h1>
              <p class="text-sm text-gray-500 mt-1">{{ t('meetings.subtitle') }}</p>
            </div>
            
            <UButton
              icon="i-lucide-plus"
              color="primary"
              :label="t('meetings.actions.new_meeting')"
              to="/app/meetings/new"
            />
          </div>

          <div class="flex items-center gap-4">
            <UInput
              v-model="filters.q"
              icon="i-lucide-search"
              :placeholder="t('meetings.filters.search_placeholder') || 'Search meetings...'"
              class="w-full"
              color="neutral"
            />
          </div>

          <UTable
            v-model:columns="columns"
            :data="data.meetings"
            :loading="pending"
            class="w-full"
          >
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-12 px-4">
                <UIcon name="i-lucide-calendar-x" class="w-12 h-12 text-gray-400 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('meetings.empty_state.title') }}</h3>
                <p class="text-sm text-gray-500 text-center mt-1">{{ t('meetings.empty_state.subtitle') }}</p>
                <UButton
                  class="mt-6"
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="subtle"
                  :label="t('meetings.actions.new_meeting')"
                  to="/app/meetings/new"
                />
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </UContainer>
  </UMain>
</template>
