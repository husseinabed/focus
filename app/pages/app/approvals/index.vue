<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

definePageMeta({
  layout: 'app'
})

const { t, locale } = useI18n()
const isRtl = computed(() => ['ar', 'he'].includes(locale.value))

useHead(() => ({
  title: t('approvals.index.title')
}))

type ApprovalChannel = 'whatsapp' | 'email' | 'sms'
type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface ApprovalRow {
  id: string
  messagePreview: string
  channel: ApprovalChannel
  status: ApprovalStatus
  createdAt: string
  reviewedBy: {
    name: string
    avatar?: string
  }
}

const approvals = ref<ApprovalRow[]>([
  {
    id: 'apr_001',
    messagePreview:
      'New lead request from WhatsApp regarding the latest proposal. Needs immediate review.',
    channel: 'whatsapp',
    status: 'pending',
    createdAt: '2026-01-21T10:00:00Z',
    reviewedBy: { name: 'Admin User' }
  },
  {
    id: 'apr_002',
    messagePreview: 'Email approval for template v2. Minor text change requested.',
    channel: 'email',
    status: 'approved',
    createdAt: '2026-01-20T15:30:00Z',
    reviewedBy: { name: 'Team Lead' }
  },
  {
    id: 'apr_003',
    messagePreview: 'SMS confirmation request pending review.',
    channel: 'sms',
    status: 'pending',
    createdAt: '2026-01-21T11:45:00Z',
    reviewedBy: { name: 'System Bot' }
  },
  {
    id: 'apr_004',
    messagePreview: 'Follow-up on WhatsApp conversation with new contact.',
    channel: 'whatsapp',
    status: 'rejected',
    createdAt: '2026-01-19T09:10:00Z',
    reviewedBy: { name: 'Operations Team' }
  }
])

const filters = reactive({
  status: 'pending' as ApprovalStatus | '',
  channel: '' as ApprovalChannel | '',
  reviewedBy: '',
  createdAtFrom: '',
  createdAtTo: ''
})

const statusOptions = computed(() => [
  { label: t('approvals.index.statuses.pending'), value: 'pending' },
  { label: t('approvals.index.statuses.approved'), value: 'approved' },
  { label: t('approvals.index.statuses.rejected'), value: 'rejected' }
])

const channelOptions = computed(() => [
  { label: t('approvals.index.channels.whatsapp'), value: 'whatsapp' },
  { label: t('approvals.index.channels.email'), value: 'email' },
  { label: t('approvals.index.channels.sms'), value: 'sms' }
])

const parseDate = (value: string) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const filteredApprovals = computed(() => {
  const from = parseDate(filters.createdAtFrom)
  const to = parseDate(filters.createdAtTo)

  return approvals.value.filter((approval) => {
    if (filters.status && approval.status !== filters.status) return false
    if (filters.channel && approval.channel !== filters.channel) return false
    if (
      filters.reviewedBy &&
      !approval.reviewedBy.name.toLowerCase().includes(filters.reviewedBy.toLowerCase())
    ) {
      return false
    }

    const approvalDate = new Date(approval.createdAt)
    if (from && approvalDate < from) return false
    if (to && approvalDate > to) return false

    return true
  })
})

const handleApprove = (approval: ApprovalRow) => {
  const found = approvals.value.find((a) => a.id === approval.id)
  if (found && found.status !== 'approved') {
    found.status = 'approved'
  }
}

const handleReject = (approval: ApprovalRow) => {
  const found = approvals.value.find((a) => a.id === approval.id)
  if (found && found.status !== 'rejected') {
    found.status = 'rejected'
  }
}

const handleOpen = (approval: ApprovalRow) => {
  console.log('Opening approval', approval.id)
}
</script>

<template>
  <UMain class="flex space-x-6 min-h-[calc(100dvh-7rem)]">
    <UCard
      class="flex  border-none shadow-none "
      :ui="{ body: 'p-0 flex flex-row h-full' }"
      :dir="isRtl ? 'rtl' : 'ltr'"
    >
      <!-- Filters Sidebar -->
      <div
        class="flex-none w-82  sticky top-0 self-start h-full overflow-y-auto p-4 space-y-4 bg-background"
      >
        <h2 class="text-xl font-semibold">{{ t('approvals.index.filters.heading') }}</h2>
        <UForm :state="filters" class="space-y-4">
          <UFormField name="status" :label="t('approvals.index.filters.status')">
            <USelect
              v-model="filters.status"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField name="channel" :label="t('approvals.index.filters.channel')">
            <USelect
              v-model="filters.channel"
              :items="channelOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField name="reviewedBy" :label="t('approvals.index.filters.reviewed_by')">
            <UInput
              v-model="filters.reviewedBy"
              :placeholder="t('approvals.index.filters.reviewed_by_placeholder')"
              class="w-full"
            />
          </UFormField>

          <UFormField name="createdAt" :label="t('approvals.index.filters.created_at_from')">
            
              <UInput
                v-model="filters.createdAtFrom"
                type="date"
                :placeholder="t('approvals.index.filters.created_at_from')"
                class="w-full"
              />
     
           
          </UFormField>
          <UFormField name="createdAt" :label="t('approvals.index.filters.created_at_to')">
            
         
              <UInput
                v-model="filters.createdAtTo"
                type="date"
                :placeholder="t('approvals.index.filters.created_at_to')"
                class="w-full"
              />
           
          </UFormField>
        </UForm>
      </div>

     

   
    </UCard>
    <UCard class="flex-1">
       <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ t('approvals.index.title') }}</h1>
          <p class="text-sm text-muted-foreground">{{ t('approvals.index.subtitle') }}</p>
        </div>

        <ApprovalsList
          :approvals="filteredApprovals"
          @approve="handleApprove"
          @reject="handleReject"
          @open="handleOpen"
        />
      </div>
    </UCard>
  </UMain>
</template>
