<script setup lang="ts">
import { computed, h, reactive, ref, resolveComponent, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { ColumnDef } from '@tanstack/table-core';
import type { Template } from '~/types/templates';

definePageMeta({
  layout: 'app',
});

const { locale } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const isRtl = computed(() => locale.value === 'he' || locale.value === 'ar');
const ui = reactive({
  importModalOpen: false,
});
const importJson = ref('');
const importPending = ref(false);

const rawStatus = (route.query.status || 'all') as string;
const filters = reactive({
  q: (route.query.q || '') as string,
  channel: (route.query.channel || 'all') as string,
  status: rawStatus === 'approved' ? 'active' : rawStatus,
  language: (route.query.language || 'any') as string,
});

const page = ref(1);
const pageSize = ref(10);

const channelOptions = [
  { label: 'All', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'active' },
  { label: 'Archived', value: 'archived' },
];

const languageOptions = [
  { label: 'Any', value: 'any' },
  { label: 'English', value: 'en' },
  { label: 'עברית', value: 'he' },
  { label: 'العربية', value: 'ar' },
];

const resolveLocale = (template: Template, preferred?: string) => {
  if (preferred && template.locales && preferred in template.locales) {
    return preferred;
  }
  const keys = template.locales ? Object.keys(template.locales) : [];
  return keys.length > 0 ? keys[0] : 'en';
};

const resolveBody = (template: Template, preferred?: string) => {
  const locale = resolveLocale(template, preferred);
  const entry = template.locales?.[locale];
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  return entry.body || '';
};

const resolveLanguage = (template: Template, preferred?: string) =>
  resolveLocale(template, preferred);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(parsed);
};

const resolveChannelBadge = (channel: string) => {
  if (channel === 'whatsapp') return 'success';
  if (channel === 'email') return 'primary';
  return 'neutral';
};

const resolveStatusBadge = (status: string) => {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'warning';
  return 'neutral';
};

const resolveStatusLabel = (status: string) => {
  if (status === 'active') return 'Approved';
  if (status === 'archived') return 'Archived';
  return 'Draft';
};
const { data, pending, error, refresh } = useAsyncData<Template[]>(
  'templates',
  () =>
    $fetch('/api/templates', {
      query: {
        q: filters.q || undefined,
        language: filters.language === 'any' ? undefined : filters.language,
        channel: filters.channel === 'all' ? undefined : filters.channel,
        status: filters.status === 'all' ? undefined : filters.status,
      },
    }) as Promise<Template[]>,
  { watch: [() => filters.language, () => filters.status] }
);

const debounceRefresh = useDebounceFn(refresh, 300);

watch(
  () => filters.q,
  () => {
    debounceRefresh();
    router.replace({
      query: {
        q: filters.q || undefined,
        channel: filters.channel === 'all' ? undefined : filters.channel,
        status: filters.status === 'all' ? undefined : filters.status,
        language: filters.language === 'any' ? undefined : filters.language,
      },
    });
  }
);

watch(
  () => [filters.channel, filters.status, filters.language],
  () => {
    page.value = 1;
    router.replace({
      query: {
        q: filters.q || undefined,
        channel: filters.channel === 'all' ? undefined : filters.channel,
        status: filters.status === 'all' ? undefined : filters.status,
        language: filters.language === 'any' ? undefined : filters.language,
      },
    });
    refresh();
  }
);

const templates = computed(() => data.value || []);
const filteredTemplates = computed(() => {
  return templates.value.filter((template) => {
    if (filters.channel !== 'all') {
      if (template.channel !== filters.channel) return false;
    }
    if (filters.status !== 'all') {
      if (template.status !== filters.status) return false;
    }
    if (filters.language !== 'any') {
      if (!template.locales || !(filters.language in template.locales)) return false;
    }
    return true;
  });
});

const total = computed(() => filteredTemplates.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
const paginatedTemplates = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredTemplates.value.slice(start, start + pageSize.value);
});

const hasActiveFilters = computed(() => {
  return (
    !!filters.q ||
    filters.channel !== 'all' ||
    filters.status !== 'all' ||
    filters.language !== 'any'
  );
});

const clearFilters = () => {
  filters.q = '';
  filters.channel = 'all';
  filters.status = 'all';
  filters.language = 'any';
};

const UBadgeComp = resolveComponent('UBadge');
const UDropdownComp = resolveComponent('UDropdownMenu');
const UButtonComp = resolveComponent('UButton');

const columns = computed<ColumnDef<Template>[]>(() => [
  {
    id: 'name',
    accessorKey: 'title',
    header: 'Template',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(
          'span',
          { class: 'text-sm font-semibold text-gray-900 dark:text-white' },
          row.original.title
        ),
        h(
          'span',
          { class: 'text-xs text-gray-500 line-clamp-2' },
          resolveBody(row.original, filters.language === 'any' ? undefined : filters.language) || '—'
        ),
      ]),
  },
  {
    id: 'channel',
    accessorKey: 'channel',
    header: 'Channel',
    cell: ({ row }) =>
      h(
        UBadgeComp,
        { color: resolveChannelBadge(row.original.channel), variant: 'subtle' },
        () => row.original.channel
      ),
  },
  {
    id: 'language',
    accessorKey: 'locales',
    header: 'Language',
    cell: ({ row }) =>
      h(
        UBadgeComp,
        { color: 'neutral', variant: 'subtle' },
        () => resolveLanguage(row.original, filters.language === 'any' ? undefined : filters.language)
      ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        UBadgeComp,
        { color: resolveStatusBadge(row.original.status), variant: 'subtle' },
        () => resolveStatusLabel(row.original.status)
      ),
  },
  {
    id: 'updated_at',
    accessorKey: 'updated_at',
    header: 'Updated',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-500' }, formatDate(row.original.updated_at)),
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
              'data-stop-row': '',
            }),
        }
      ),
  },
]);

const rowActions = (row: Template) => {
  const actions = [
    [
      { label: 'Open', icon: 'i-heroicons-eye', to: `/app/templates/${row.id}` },
      { label: 'Edit', icon: 'i-heroicons-pencil-square', to: `/app/templates/${row.id}/edit` },
      { label: 'Duplicate', icon: 'i-heroicons-document-duplicate', onSelect: () => duplicateTemplate(row) },
    ],
  ];

  if (row.status !== 'archived') {
    actions.push([
      {
        label: 'Archive',
        icon: 'i-heroicons-archive-box',
        onSelect: () => archiveTemplate(row),
      },
    ]);
  }

  return actions;
};

const duplicateTemplate = async (template: Template) => {
  try {
    await $fetch('/api/templates', {
      method: 'POST',
      body: {
        title: `${template.title} (Copy)`,
        category: template.category,
        channel: template.channel,
        status: template.status,
        locales: template.locales,
        variants: template.variants,
        variables_schema: template.variables_schema,
        defaults: template.defaults,
        rules: template.rules,
        compliance: template.compliance,
        tags: template.tags,
      },
    });
    toast.add({ title: 'Template duplicated', color: 'success' });
    refresh();
  } catch (err: any) {
    toast.add({ title: 'Duplicate failed', description: err?.message, color: 'error' });
  }
};

const archiveTemplate = async (template: Template) => {
  if (template.status === 'archived') return;
  try {
    await $fetch(`/api/templates/${template.id}`, {
      method: 'PUT',
      body: { status: 'archived' },
    });
    toast.add({ title: 'Template archived', color: 'success' });
    refresh();
  } catch (err: any) {
    toast.add({ title: 'Archive failed', description: err?.message, color: 'error' });
  }
};

const importTemplates = async () => {
  if (!importJson.value.trim()) {
    toast.add({ title: 'Paste template JSON to import', color: 'neutral' });
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(importJson.value);
  } catch (err: any) {
    toast.add({ title: 'Invalid JSON', description: err?.message, color: 'error' });
    return;
  }

  if (!Array.isArray(payload)) {
    toast.add({ title: 'JSON must be an array of templates', color: 'error' });
    return;
  }

  importPending.value = true;
  try {
    const result = await $fetch<{ imported: number; errors: number }>(
      '/api/templates/import',
      { method: 'POST', body: payload }
    );
    toast.add({
      title: `Imported ${result.imported} template${result.imported === 1 ? '' : 's'}`,
      description: result.errors ? `${result.errors} failed` : undefined,
      color: result.errors ? 'warning' : 'success',
    });
    importJson.value = '';
    ui.importModalOpen = false;
    refresh();
  } catch (err: any) {
    toast.add({ title: 'Import failed', description: err?.message, color: 'error' });
  } finally {
    importPending.value = false;
  }
};
</script>

<template>
  <UContainer :dir="isRtl ? 'rtl' : 'ltr'" class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Templates</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Browse and manage message templates across channels.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton label="New template" icon="i-heroicons-plus" to="/app/templates/new" color="primary" />
        <UButton
          label="Import"
          icon="i-heroicons-arrow-down-tray"
          color="neutral"
          variant="outline"
          @click="ui.importModalOpen = true"
        />
      </div>
    </section>

    <UCard>
      <div class="grid grid-cols-1 lg:grid-cols-[1.3fr_repeat(3,0.7fr)] gap-3">
        <UFormField label="Search">
          <UInput
            v-model="filters.q"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search templates..."
            class="w-full"
          />
        </UFormField>
        <UFormField label="Channel">
          <USelectMenu
            v-model="filters.channel"
            :items="channelOptions"
            option-attribute="label"
            value-attribute="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Status">
          <USelectMenu
            v-model="filters.status"
            :items="statusOptions"
            option-attribute="label"
            value-attribute="value"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Language">
          <USelectMenu
            v-model="filters.language"
            :items="languageOptions"
            option-attribute="label"
            value-attribute="value"
            class="w-full"
          />
        </UFormField>
      </div>
      <USeparator class="my-4" />
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-500">
          {{ total }} templates · {{ pageSize }} per page
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <USelectMenu
            v-model="pageSize"
            :items="[
              { label: '10 / page', value: 10 },
              { label: '20 / page', value: 20 },
              { label: '50 / page', value: 50 },
            ]"
            option-attribute="label"
            value-attribute="value"
            class="w-full sm:w-40"
          />
          <UButton
            v-if="hasActiveFilters"
            label="Clear filters"
            color="neutral"
            variant="soft"
            @click="clearFilters"
          />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Template library</h2>
          <p class="text-sm text-gray-500">Quickly duplicate, edit, and track approvals.</p>
        </div>
      </template>

      <div v-if="error" class="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-10 w-10 text-red-500" />
        <div class="space-y-1">
          <p class="text-base font-semibold text-gray-900 dark:text-white">Something went wrong</p>
          <p class="text-sm text-gray-500">We couldn’t load templates. Try again.</p>
        </div>
        <UButton label="Retry" color="neutral" variant="soft" @click="refresh" />
      </div>

      <div v-else-if="!pending && total === 0" class="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="h-10 w-10 text-gray-400" />
        <div class="space-y-1">
          <p class="text-base font-semibold text-gray-900 dark:text-white">No templates yet</p>
          <p class="text-sm text-gray-500">
            Create your first template to start messaging leads faster.
          </p>
        </div>
        <UButton label="Create template" color="primary" to="/app/templates/new" />
      </div>

      <UTable
        v-else
        :columns="columns"
        :data="paginatedTemplates"
        :loading="pending"
        sticky-header
        row-key="id"
      />

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-sm text-gray-500">
            Showing {{ paginatedTemplates.length }} of {{ total }}
          </span>
          <UPagination v-model="page" :page-count="totalPages" :total="total" />
        </div>
      </template>
    </UCard>

    <UModal v-model:open="ui.importModalOpen" title="Import templates">
      <template #body>
        <UFormField label="Paste JSON">
        <UTextarea
            v-model="importJson"
            rows="8"
            placeholder="Paste your template JSON..."
            class="w-full"
          />
        </UFormField>
      </template>
      <template #footer="{ close }">
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
          <UButton label="Import" color="primary" :loading="importPending" @click="importTemplates" />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
