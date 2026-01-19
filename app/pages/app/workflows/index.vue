<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-xl text-gray-900 dark:text-white leading-tight">
          Workflows
        </h2>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-plus"
            label="New Workflow"
            to="/app/workflows/new"
            color="primary"
          />
          <UButton
            icon="i-heroicons-arrow-down-tray"
            label="Import"
            color="secondary"
            @click="isImportModalOpen = true"
          />
        </div>
      </div>
    </template>

    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <UInput
        v-model="filters.search"
        placeholder="Search workflows..."
        icon="i-heroicons-magnifying-glass"
        class="w-full"
        debounce="300"
      />
      <USelect
        v-model="filters.active"
        :items="activeStatusOptions"
        placeholder="Filter by status"
        class="w-full"
        value-key="value"
        label-key="label"
      />
      <USelect
        v-model="filters.triggerType"
        :items="triggerTypeOptions"
        placeholder="Filter by trigger type"
        class="w-full"
        value-key="value"
        label-key="label"
      />
    </div>

    <div v-if="pending" class="space-y-2">
      <USkeleton class="h-8 w-full" v-for="i in 5" :key="i" />
    </div>

    <div v-else-if="error" class="py-10 text-center">
      <p class="text-lg text-red-500">Error loading workflows.</p>
      <UButton label="Retry" @click="() => refresh()" class="mt-4" />
    </div>

    <div v-else-if="workflows.length === 0 && !filtersApplied" class="py-10 text-center">
      <p class="text-lg">No workflows yet.</p>
      <p class="text-sm text-gray-500">Create your first workflow to get started.</p>
      <UButton label="Create New Workflow" to="/app/workflows/new" class="mt-4" />
    </div>

    <div v-else-if="workflows.length === 0 && filtersApplied" class="py-10 text-center">
      <p class="text-lg">No workflows found matching your criteria.</p>
      <UButton label="Clear Filters" @click="clearFilters" class="mt-4" />
    </div>

    <div v-else>
      <UTable
        :columns="columns"
        :data="workflows"
        :empty-state="{
          icon: 'i-heroicons-magnifying-glass',
          label: 'No workflows found.',
        }"
      >
        <template #trigger-cell="{ row }">
          <UBadge
            :color="row.original.trigger === 'manual' ? 'neutral' : 'primary'"
            variant="subtle"
          >
            {{ row.original.trigger }}
          </UBadge>
        </template>
        <template #active-cell="{ row }">
          <UBadge :color="row.original.active ? 'success' : 'error'" variant="subtle">
            {{ row.original.active ? "Active" : "Inactive" }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <UDropdownMenu :items="rowActions(row.original)">
            <UButton
              icon="i-heroicons-ellipsis-horizontal"
              color="neutral"
              variant="ghost"
              aria-label="Workflow actions"
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
            <h3 class="text-lg font-semibold">Import Workflow</h3>
          </template>
          <UTextarea
            v-model="importJson"
            placeholder="Paste workflow JSON here..."
            class="w-full"
            :rows="10"
          />
          <UCheckbox v-model="validateOnly" label="Validate only" class="mt-4" />
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                @click="isImportModalOpen = false"
              />
              <UButton label="Validate" @click="validateImport" :disabled="!importJson" />
              <UButton
                label="Import"
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
const toast = useToast();

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

const activeStatusOptions = [
  { label: "All", value: null },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const triggerTypeOptions = [
  { label: "All", value: null },
  { label: "Manual", value: "manual" },
  { label: "API", value: "api" },
  { label: "Schedule", value: "schedule" },
];

const columns = [
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "description", accessorKey: "description", header: "Description" },
  { id: "trigger", accessorKey: "trigger", header: "Trigger" },
  { id: "active", accessorKey: "active", header: "Status" },
  { id: "created_at", accessorKey: "created_at", header: "Created At" },
  { id: "actions", header: "Actions" },
];

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
        title: "Error",
        description: "Failed to fetch workflows.",
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
      label: "View",
      icon: "i-heroicons-eye",
      onSelect: () => router.push(`/app/workflows/${row.id}`),
    },
    {
      label: "Edit",
      icon: "i-heroicons-pencil-square",
      onSelect: () => router.push(`/app/workflows/${row.id}/edit`),
    },
  ],
  [
    {
      label: row.active ? "Deactivate" : "Activate",
      icon: row.active ? "i-heroicons-x-circle" : "i-heroicons-check-circle",
      onSelect: () => toggleWorkflowStatus(row),
    },
    {
      label: "Delete",
      icon: "i-heroicons-trash",
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
      title: "Success",
      description: "Workflow status updated.",
      color: "success",
    });
    refresh();
  } catch (e) {
    toast.add({
      title: "Error",
      description: "Failed to update workflow status.",
      color: "error",
    });
  }
};

const deleteWorkflow = async (id: string) => {
  if (!confirm("Are you sure you want to delete this workflow?")) return;
  try {
    await $fetch(`/api/workflows/${id}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Success",
      description: "Workflow deleted successfully.",
      color: "success",
    });
    refresh();
  } catch (e) {
    toast.add({
      title: "Error",
      description: "Failed to delete workflow.",
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
      title: "Success",
      description: "Workflow JSON is valid.",
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: "Error",
      description: "Invalid JSON: " + e.message,
      color: "error",
    });
  }
};

const importWorkflow = async () => {
  try {
    const json = JSON.parse(importJson.value);
    const response = await $fetch("/api/workflows", {
      method: "POST",
      body: json,
    });
    toast.add({
      title: "Success",
      description: "Workflow imported successfully!",
      color: "success",
    });
    isImportModalOpen.value = false;
    importJson.value = "";
    refresh();
  } catch (e: any) {
    toast.add({
      title: "Error",
      description: "Failed to import workflow: " + e.message,
      color: "error",
    });
  }
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
