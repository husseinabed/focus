<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDebounceFn } from '@vueuse/core';
import type { TableColumn } from '@nuxt/ui';
import type { Template } from '~/types/templates';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const q = ref((route.query.q || '') as string);
const category = ref((route.query.category || 'all') as string);
const language = ref((route.query.language || 'all') as string);
const active = ref((route.query.active || 'all') as string);

const categories = ['all', 'outreach', 'followup', 'reply', 'qualification', 'proposal'];
const languages = ['all', 'he', 'ar', 'en', 'auto'];
const activeOptions = ['all', 'active', 'inactive'];

const columns: TableColumn<Template>[] = [{
  id: 'name',
  label: 'Name',
  sortable: true
}, {
  id: 'category',
  label: 'Category',
  sortable: true
}, {
  id: 'language',
  label: 'Language',
  sortable: true
}, {
  id: 'is_active',
  label: 'Status',
  sortable: true
}, {
  id: 'updated_at',
  label: 'Updated At',
  sortable: true
}, {
  id: 'actions',
  label: 'Actions',
  class: 'w-20'
}];

const { data: templates, pending, refresh } = useAsyncData<Template[]>(
  'templates',
  () => $fetch('/api/templates', {
    query: {
      q: q.value,
      category: category.value === 'all' ? undefined : category.value,
      language: language.value === 'all' ? undefined : language.value,
      active: active.value === 'all' ? undefined : active.value,
    },
  }) as Promise<Template[]>,
  { watch: [q, category, language, active] }
);

const debounceRefresh = useDebounceFn(refresh, 250);

watch(q, () => {
  debounceRefresh();
});

watch([category, language, active], () => {
  router.push({
    query: {
      q: q.value || undefined,
      category: category.value === 'all' ? undefined : category.value,
      language: language.value === 'all' ? undefined : language.value,
      active: active.value === 'all' ? undefined : active.value,
    },
  });
  refresh();
});

const actions = (row: Template) => [
  [
    { label: 'Edit', icon: 'i-heroicons-pencil-square', to: `/app/templates/${row.id}/edit` },
    { label: 'Duplicate', icon: 'i-heroicons-document-duplicate', click: () => duplicateTemplate(row) },
    { label: 'Export JSON', icon: 'i-heroicons-arrow-down-tray', click: () => exportTemplate(row) },
  ],
  [
    { label: 'Delete', icon: 'i-heroicons-trash', color: 'red', click: () => deleteTemplate(row) },
  ],
];

const duplicateTemplate = (template: Template) => {
  // TODO: Implement duplication logic, e.g., navigate to new template page with pre-filled data
  console.log('Duplicate template:', template);
};

const exportTemplate = async (template: Template) => {
  try {
    const response = await $fetch(`/api/templates/${template.id}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template-${template.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting template:', error);
    // TODO: Show a user-friendly error notification
  }
};

const deleteTemplate = async (template: Template) => {
  if (confirm('Are you sure you want to delete this template?')) {
    try {
      await $fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
      refresh();
      // TODO: Show success notification
    } catch (error) {
      console.error('Error deleting template:', error);
      // TODO: Show error notification
    }
  }
};

const openImportModal = () => {
  // TODO: Implement import modal logic
  console.log('Open import modal');
};
</script>

<template>
  <UMain>
    <template #header>
      <UContainer>
        <UPageHeader
          :title="t('templates.title')"
          :ui="{wrapper: 'border-none', container: 'gap-3'}"
        >
          <template #actions>
            <UButton
              :label="t('templates.actions.new')"
              icon="i-heroicons-plus-circle"
              color="primary"
              variant="solid"
              to="/app/templates/new"
            />
            <UButton
              :label="t('common.import_json')"
              icon="i-heroicons-arrow-down-tray"
              color="primary"
              variant="soft"
              @click="openImportModal"
            />
          </template>
        </UPageHeader>
      </UContainer>
    </template>

    <UContainer>
      <UCard>
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <UInput
            v-model="q"
            :placeholder="t('templates.search')"
            icon="i-heroicons-magnifying-glass-20-solid"
            class="w-48"
            autocomplete="off"
          />

          <div class="flex gap-3">
            <USelectMenu
              v-model="category"
              :options="categories"
              placeholder="Category"
              class="w-32"
            />
            <USelectMenu
              v-model="language"
              :options="languages"
              placeholder="Language"
              class="w-32"
            />
            <USelectMenu
              v-model="active"
              :options="activeOptions"
              placeholder="Status"
              class="w-32"
            />
          </div>
        </div>

        <UTable :rows="templates || []" :columns="columns" :loading="pending">
          <template #category-data="{ row }">
            <UBadge :label="row.category" color="neutral" variant="soft" />
          </template>
          <template #language-data="{ row }">
            <UBadge :label="row.language" color="neutral" variant="soft" />
          </template>
          <template #is_active-data="{ row }">
            <UBadge
              :label="row.is_active ? 'Active' : 'Inactive'"
              :color="row.is_active ? 'success' : 'error'"
              variant="soft"
            />
          </template>
          <template #updated_at-data="{ row }">
            {{ new Date(row.updated_at).toLocaleDateString() }}
          </template>
          <template #actions-data="{ row }">
            <UDropdown :items="actions(row)">
              <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
            </UDropdown>
          </template>
        </UTable>

        <div v-if="!pending && (!templates || (Array.isArray(templates) && templates.length === 0))" class="flex flex-col items-center justify-center py-8 gap-3">
          <UIcon name="i-heroicons-folder" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ t('templates.empty.title') }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-center">{{ t('templates.empty.subtitle') }}</p>
          <UButton
            :label="t('templates.actions.new')"
            icon="i-heroicons-plus-circle"
            color="primary"
            variant="solid"
            to="/app/templates/new"
          />
        </div>
      </UCard>
    </UContainer>
  </UMain>
</template>
