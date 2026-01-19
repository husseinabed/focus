<template>
  <UCard class="w-full" divide="divide-y divide-gray-200 dark:divide-gray-800">
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-white">
          {{ $t('approvals.title') }}
        </h2>
        <div class="flex items-center gap-2">
          <USelectMenu
            v-model="selectedStatus"
            :items="statusOptions"
            option-attribute="label"
            value-attribute="value"
            color="neutral"
            class="w-48"
            :placeholder="$t('approvals.filter_by_status')"
          />
          <UButton
            icon="i-heroicons-check-circle"
            color="success"
            :label="$t('approvals.bulk_approve')"
            :disabled="selectedApprovals.length === 0"
            @click="bulkApprove"
          />
          <UButton
            icon="i-heroicons-x-circle"
            color="error"
            :label="$t('approvals.bulk_reject')"
            :disabled="selectedApprovals.length === 0"
            @click="bulkReject"
          />
        </div>
      </div>
    </template>

    <div class="w-full overflow-x-auto">
      <ClientOnly>
        <UTable
        v-model:selected="selectedApprovals"
        :columns="(columns as TableColumn<Approval>[])"
        :rows="paginatedApprovals"
        :loading="loading"
        :empty-state="emptyState"
        class="w-full"
      >
        <template #select-header>
          <UCheckbox
            :model-value="isAllPageSelected"
            :indeterminate="isPageIndeterminate"
            @change="onSelectAllPage"
          />
        </template>

        <template #lead-data="{ row }">
          <div>
            <p class="font-medium">{{ row.original.leadName }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ row.original.company }}</p>
          </div>
        </template>

        <template #messageSnippet-data="{ row }">
          <p class="line-clamp-2 text-sm">{{ row.original.messageSnippet }}</p>
        </template>

        <template #status-data="{ row }">
          <UBadge
            :label="$t(`approvals.status.${row.original.status}`)"
            :color="getStatusColor(row.original.status)"
            variant="subtle"
          />
        </template>

        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ getRelativeTime(row.original.createdAt) }}</span>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-heroicons-check"
            color="success"
            variant="soft"
            size="sm"
            :label="$t('approvals.approve')"
            @click="approveApproval(row.original.id)"
          />
          <UButton
            icon="i-heroicons-x"
            color="error"
            variant="soft"
            size="sm"
            :label="$t('approvals.reject')"
            @click="rejectApproval(row.original.id)"
          />
        </template>
      </UTable>
      </ClientOnly>
    </div>

    <template #footer>
      <div class="flex justify-between items-center flex-wrap gap-2">
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="filteredApprovals.length"
          color="neutral"
          variant="outline"
        />
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('pagination.showing', { start: (page - 1) * pageCount + 1, end: Math.min(page * pageCount, filteredApprovals.length), total: filteredApprovals.length }) }}
        </span>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimeAgo } from '@vueuse/core';
import type { TableColumn } from "@nuxt/ui"; // Import TableColumn

const { t, locale } = useI18n();

// Dummy data model for approvals (replace with actual data fetching)
interface Approval {
  id: number;
  leadName: string;
  company: string;
  messageSnippet: string;
  status: 'pending' | 'draft' | 'approved' | 'rejected';
  createdAt: string;
  templateUsed?: boolean;
  aiSuggested?: boolean;
}

const approvals = ref<Approval[]>([
  { id: 1, leadName: 'John Doe', company: 'Acme Corp', messageSnippet: 'Hi John, I hope this email finds you well. I wanted to follow up on our previous conversation...', status: 'pending', createdAt: '2026-01-16T10:00:00Z', templateUsed: true },
  { id: 2, leadName: 'Jane Smith', company: 'Globex Inc', messageSnippet: 'Dear Jane, I am writing to you today to discuss a potential partnership...', status: 'draft', createdAt: '2026-01-15T14:30:00Z', aiSuggested: true },
  { id: 3, leadName: 'Peter Jones', company: 'Soylent Corp', messageSnippet: 'Hello Peter, I saw your profile on LinkedIn and was very impressed...', status: 'approved', createdAt: '2026-01-14T09:00:00Z' },
  { id: 4, leadName: 'Alice Brown', company: 'Wayne Enterprises', messageSnippet: 'Hi Alice, Just touching base regarding the proposal we sent last week...', status: 'pending', createdAt: '2026-01-17T08:00:00Z', templateUsed: true, aiSuggested: true },
  { id: 5, leadName: 'Bob White', company: 'Stark Industries', messageSnippet: 'Greetings Bob, I have an exciting opportunity that I believe would be a great fit...', status: 'pending', createdAt: '2026-01-17T12:00:00Z'},
  { id: 6, leadName: 'Charlie Green', company: 'Cyberdyne Systems', messageSnippet: 'Hello Charlie, I wanted to introduce myself and Brandi Digital...', status: 'draft', createdAt: '2026-01-17T15:00:00Z'},
]);

const loading = ref(false);
const selectedApprovals = ref<Approval[]>([]);
console.log('SSR/CSR: Initial selectedApprovals:', selectedApprovals.value);
const page = ref(1);
const pageCount = 10;
const selectedStatus = ref('');

const statusOptions = computed(() => [
  { label: t('approvals.status.all'), value: '' },
  { label: t('approvals.status.pending'), value: 'pending' },
  { label: t('approvals.status.draft'), value: 'draft' },
  { label: t('approvals.status.approved'), value: 'approved' },
  { label: t('approvals.status.rejected'), value: 'rejected' },
]);

const filteredApprovals = computed(() => {
  if (!selectedStatus.value) {
    return approvals.value;
  }
  return approvals.value.filter(approval => approval.status === selectedStatus.value);
});

const paginatedApprovals = computed(() => {
  const start = (page.value - 1) * pageCount;
  const end = start + pageCount;
  return filteredApprovals.value.slice(start, end);
});
console.log('SSR/CSR: paginatedApprovals computed:', paginatedApprovals.value.map(a => a.id));

const columns = computed<TableColumn<Approval>[]>(() => [
  {
    id: 'select',
    label: '',
    class: 'w-10',
  },
  { key: 'lead', id: 'lead', label: t('approvals.table.lead_company') },
  { key: 'messageSnippet', id: 'messageSnippet', label: t('approvals.table.message_snippet') },
  { key: 'status', id: 'status', label: t('approvals.table.status') },
  { key: 'createdAt', id: 'createdAt', label: t('approvals.table.created_at') },
  { key: 'actions', id: 'actions', label: t('approvals.table.actions'), class: 'w-24' },
]);

const emptyState = computed(() => ({
  icon: 'i-heroicons-inbox-stack',
  title: t('approvals.empty_states.no_approvals.title'),
  description: t('approvals.empty_states.no_approvals.description'),
}));

const getStatusColor = (status: Approval['status']) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'draft':
      return 'info';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'neutral';
  }
};

const getRelativeTime = (isoDateString: string) => {
  const date = new Date(isoDateString);
  const timeAgo = useTimeAgo(date);
  return timeAgo.value;
};

const isAllPageSelected = computed(() => selectedApprovals.value.length === paginatedApprovals.value.length && selectedApprovals.value.length > 0);
const isPageIndeterminate = computed(() => selectedApprovals.value.length > 0 && selectedApprovals.value.length < paginatedApprovals.value.length);
console.log('SSR/CSR: isAllPageSelected:', isAllPageSelected.value, 'isPageIndeterminate:', isPageIndeterminate.value);

const onSelectAllPage = () => {
  if (isAllPageSelected.value) {
    selectedApprovals.value = [];
  } else {
    selectedApprovals.value = [...paginatedApprovals.value];
  }
};

watch(page, () => {
  selectedApprovals.value = [];
});

const bulkApprove = () => {
  // Implement bulk approve logic here
  console.log('Bulk approving:', selectedApprovals.value.map(a => a.id));
  // For dummy data, just update the status
  selectedApprovals.value.forEach(selected => {
    const index = approvals.value.findIndex(a => a.id === selected.id);
    if (index !== -1 && approvals.value[index]) {
      approvals.value[index].status = 'approved';
    }
  });
  selectedApprovals.value = [];
};

const bulkReject = () => {
  // Implement bulk reject logic here
  console.log('Bulk rejecting:', selectedApprovals.value.map(a => a.id));
  // For dummy data, just update the status
  selectedApprovals.value.forEach(selected => {
    const index = approvals.value.findIndex(a => a.id === selected.id);
    if (index !== -1 && approvals.value[index]) {
      approvals.value[index].status = 'rejected';
    }
  });
  selectedApprovals.value = [];
};

const approveApproval = (id: number) => {
  // Implement single approve logic here
  console.log('Approving:', id);
  const index = approvals.value.findIndex(a => a.id === id);
  if (index !== -1 && approvals.value[index]) {
    approvals.value[index].status = 'approved';
  }
};

const rejectApproval = (id: number) => {
  // Implement single reject logic here
  console.log('Rejecting:', id);
  const index = approvals.value.findIndex(a => a.id === id);
  if (index !== -1 && approvals.value[index]) {
    approvals.value[index].status = 'rejected';
  }
};

// RTL compatibility: Assuming Nuxt UI handles most of this based on i18n locale.
// For explicit RTL overrides, additional CSS or dynamic class bindings might be needed.
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
