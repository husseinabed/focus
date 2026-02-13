<template>
  <UCard :dir="isRtl ? 'rtl' : 'ltr'">
    <template #header>
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
            {{ t("ui.workflows.list.v1.header.title") }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ t("ui.workflows.list.v1.page.subtitle") }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-plus"
            :label="t('ui.workflows.list.v1.actions.new_workflow')"
            to="/app/workflows/new"
            color="primary"
          />
          <UButton
            icon="i-lucide-arrow-down-to-line"
            :label="t('ui.workflows.list.v1.actions.import')"
            color="neutral"
            @click="isImportModalOpen = true"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <UInput
        v-model="filters.search"
        :placeholder="t('ui.workflows.list.v1.filters.search')"
        icon="i-lucide-search"
        class="w-full"
        debounce="300"
      />
      <USelect
        v-model="filters.active"
        :items="activeStatusOptions"
        :placeholder="t('ui.workflows.list.v1.filters.active')"
        class="w-full"
        value-key="value"
        label-key="label"
      />
      <USelect
        v-model="filters.triggerType"
        :items="triggerTypeOptions"
        :placeholder="t('ui.workflows.list.v1.filters.trigger_type')"
        class="w-full"
        value-key="value"
        label-key="label"
      />
    </div>

    <div v-if="pending" class="space-y-2">
      <USkeleton class="h-8 w-full" v-for="i in 5" :key="i" />
    </div>

    <div v-else-if="error" class="py-10 text-center">
      <p class="text-lg text-red-500">{{ t("ui.common.error") }}</p>
      <p class="text-sm text-gray-500 mt-2">
        {{ t("ui.workflows.list.v1.states.error.subtitle") }}
      </p>
      <UButton :label="t('ui.common.retry')" @click="() => refresh()" class="mt-4" />
    </div>

    <div v-else-if="workflows.length === 0 && !filtersApplied" class="py-10 text-center">
      <p class="text-lg">{{ t("ui.workflows.list.v1.states.empty.title") }}</p>
      <p class="text-sm text-gray-500">
        {{ t("ui.workflows.list.v1.states.empty.subtitle") }}
      </p>
      <UButton
        :label="t('ui.workflows.list.v1.actions.create_first')"
        to="/app/workflows/new"
        class="mt-4"
      />
    </div>

    <div v-else-if="workflows.length === 0 && filtersApplied" class="py-10 text-center">
      <p class="text-lg">{{ t("ui.workflows.list.v1.states.no_results.title") }}</p>
      <p class="text-sm text-gray-500">
        {{ t("ui.workflows.list.v1.states.no_results.subtitle") }}
      </p>
      <UButton
        :label="t('ui.common.clear_filters')"
        @click="clearFilters"
        class="mt-4"
      />
    </div>

    <div v-else>
      <UTable
        :columns="columns"
        :data="workflows"
        :empty-state="{
          icon: 'i-lucide-search-x',
          label: t('ui.workflows.list.v1.states.no_results.title'),
        }"
      >
        <template #name-cell="{ row }">
          <div class="space-y-1">
            <div class="font-medium text-gray-900 dark:text-white">
              {{ row.original.name }}
            </div>
            <div class="text-sm text-gray-500">
              {{ row.original.description || "-" }}
            </div>
          </div>
        </template>
        <template #trigger-cell="{ row }">
          <UBadge
            :color="row.original.trigger === 'manual' ? 'neutral' : 'primary'"
            variant="subtle"
          >
            {{ triggerLabels[row.original.trigger] || row.original.trigger }}
          </UBadge>
        </template>
        <template #active-cell="{ row }">
          <UBadge :color="row.original.active ? 'success' : 'error'" variant="subtle">
            {{
              row.original.active
                ? t("ui.common.active")
                : t("ui.common.inactive")
            }}
          </UBadge>
        </template>
        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="rowActions(row.original)">
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              :aria-label="t('ui.common.actions')"
            />
          </UDropdownMenu>
        </template>
      </UTable>
      <div
        class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
      >
        <UPagination
          v-model="pagination.page"
          :page-count="pagination.pageSize"
          :total="total"
          @update:model-value="onPageChange"
        />
      </div>
    </div>

    <UModal v-model:open="isImportModalOpen">
      <template #body>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t("ui.workflows.import.title") }}
            </h3>
          </template>
          <UTextarea
            v-model="importJson"
            :placeholder="t('ui.workflows.import.placeholder')"
            class="w-full"
            :rows="10"
          />
          <UCheckbox
            v-model="validateOnly"
            :label="t('ui.workflows.import.validate_only')"
            class="mt-4"
          />
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                :label="t('ui.common.cancel')"
                color="neutral"
                @click="isImportModalOpen = false"
              />
              <UButton
                :label="t('ui.common.validate')"
                color="neutral"
                @click="validateImport"
                :disabled="!importJson"
              />
              <UButton
                :label="t('ui.common.import')"
                color="primary"
                @click="importWorkflow"
                :disabled="!importJson || validateOnly"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "app",
  middleware: ["auth"],
});

const router = useRouter();
const { t, locale } = useI18n();
const toast = useToast();
const isRtl = computed(() => ["ar", "he"].includes(locale.value));

useHead(() => ({
  title: t("ui.workflows.list.v1.page.title"),
}));

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "api" | "schedule";
  active: boolean;
  created_at: string;
  updated_at: string;
}

const error = ref(false);
const isImportModalOpen = ref(false);
const importJson = ref("");
const validateOnly = ref(false);

const filters = reactive({
  search: "",
  active: null as string | null,
  triggerType: null as string | null,
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
});

const activeStatusOptions = computed(() => [
  { label: t("ui.common.all"), value: null },
  { label: t("ui.common.active"), value: "true" },
  { label: t("ui.common.inactive"), value: "false" },
]);

const triggerTypeOptions = computed(() => [
  { label: t("ui.common.all"), value: null },
  { label: t("ui.workflows.trigger.manual"), value: "manual" },
  { label: t("ui.workflows.trigger.api"), value: "api" },
  { label: t("ui.workflows.trigger.schedule"), value: "schedule" },
]);

const triggerLabels = computed(() => ({
  manual: t("ui.workflows.trigger.manual"),
  api: t("ui.workflows.trigger.api"),
  schedule: t("ui.workflows.trigger.schedule"),
}));

const columns = computed(() => [
  { id: "name", accessorKey: "name", header: t("ui.common.name") },
  { id: "trigger", accessorKey: "trigger", header: t("ui.workflows.columns.trigger") },
  { id: "active", accessorKey: "active", header: t("ui.workflows.columns.status") },
  { id: "created_at", accessorKey: "created_at", header: t("ui.common.created_at") },
  { id: "actions", header: t("ui.common.actions") },
]);

const filtersApplied = computed(() => {
  return filters.search !== "" || filters.active !== null || filters.triggerType !== null;
});

const fetchWorkflows = async () => {
  const query = new URLSearchParams();
  if (filters.search) query.append("search", filters.search);
  if (filters.active !== null) query.append("is_active", filters.active);
  if (filters.triggerType !== null) query.append("trigger_type", filters.triggerType);
  query.append("page", pagination.page.toString());
  query.append("pageSize", pagination.pageSize.toString());

  const headers = useRequestHeaders(["cookie"]);
  const response = await $fetch("/api/workflows", { query, headers });
  return {
    data: response.data as Workflow[],
    count: response.count || 0,
  };
};

const { data, pending, refresh } = useAsyncData(
  "workflows",
  async () => {
    try {
      const result = await fetchWorkflows();
      error.value = false;
      return result;
    } catch (e) {
      console.error(e);
      error.value = true;
      toast.add({
        title: t("ui.common.error"),
        description: t("ui.workflows.toasts.fetch_failed"),
        color: "error",
      });
      return { data: [], count: 0 };
    }
  },
  { watch: [filters, () => pagination.page] }
);

const workflows = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.count ?? 0);

const onPageChange = (page: number) => {
  pagination.page = page;
  refresh();
};

const clearFilters = () => {
  filters.search = "";
  filters.active = null;
  filters.triggerType = null;
  pagination.page = 1;
  refresh();
};

const rowActions = (row: Workflow) => [
  [
    {
      label: t("ui.common.view"),
      icon: "i-lucide-eye",
      onSelect: () => router.push(`/app/workflows/${row.id}`),
    },
    {
      label: t("ui.common.edit"),
      icon: "i-lucide-pencil",
      onSelect: () => router.push(`/app/workflows/${row.id}/edit`),
    },
  ],
  [
    {
      label: row.active ? t("ui.common.deactivate") : t("ui.common.activate"),
      icon: row.active ? "i-lucide-x-circle" : "i-lucide-check-circle",
      onSelect: () => toggleWorkflowStatus(row),
    },
    {
      label: t("ui.common.delete"),
      icon: "i-lucide-trash",
      onSelect: () => deleteWorkflow(row.id),
    },
  ],
];

const toggleWorkflowStatus = async (workflow: Workflow) => {
  try {
    await $fetch(`/api/workflows/${workflow.id}`, {
      method: "PUT",
      body: { active: !workflow.active },
    });
    toast.add({
      title: t("ui.workflows.toasts.status_updated"),
      color: "success",
    });
    refresh();
  } catch (e) {
    toast.add({
      title: t("ui.common.error"),
      description: t("ui.workflows.toasts.status_failed"),
      color: "error",
    });
  }
};

const deleteWorkflow = async (id: string) => {
  if (
    !confirm(
      `${t("ui.workflows.confirm_delete.title")}\n${t(
        "ui.workflows.confirm_delete.message"
      )}`
    )
  )
    return;
  try {
    await $fetch(`/api/workflows/${id}`, {
      method: "DELETE",
    });
    toast.add({
      title: t("ui.workflows.toasts.deleted"),
      color: "success",
    });
    refresh();
  } catch (e) {
    toast.add({
      title: t("ui.common.error"),
      description: t("ui.workflows.toasts.delete_failed"),
      color: "error",
    });
  }
};

const validateImport = () => {
  try {
    const json = JSON.parse(importJson.value);
    // Basic validation for workflow structure
    if (!json.name || !json.description || !json.trigger) {
      throw new Error("Missing required workflow fields.");
    }
    if (!Array.isArray(json.nodes) || !Array.isArray(json.edges)) {
      throw new Error("Workflow must contain nodes and edges arrays.");
    }
    toast.add({
      title: t("ui.workflows.toasts.import_valid"),
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: t("ui.common.error"),
      description: `${t("ui.workflows.toasts.import_invalid")}: ${e.message}`,
      color: "error",
    });
  }
};

const importWorkflow = async () => {
  try {
    const json = JSON.parse(importJson.value);
    await $fetch("/api/workflows", {
      method: "POST",
      body: json,
    });
    toast.add({
      title: t("ui.workflows.toasts.imported"),
      color: "success",
    });
    isImportModalOpen.value = false;
    importJson.value = "";
    refresh();
  } catch (e: any) {
    toast.add({
      title: t("ui.common.error"),
      description: `${t("ui.workflows.toasts.import_failed")}: ${e.message}`,
      color: "error",
    });
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(locale.value, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

watch(
  filters,
  () => {
    pagination.page = 1;
    refresh();
  },
  { deep: true }
);
</script>
