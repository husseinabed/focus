<script setup lang="ts">
import { v4 as uuid } from "uuid";
import { useWorkflowRunner } from "~/composables/useWorkflowRunner";
import type { Tables } from "~/types/supabase";

// Page meta
definePageMeta({
  layout: "app",
});

const route = useRoute();
const headers = useRequestHeaders(["cookie"]);
const { t } = useI18n();

type WorkflowDetail = {
  workflow: Tables<"workflows"> | null;
  versions: Tables<"workflow_versions">[];
  runs: Tables<"workflow_runs">[];
};

// Data loading
const { data, refresh, pending } = await useAsyncData<WorkflowDetail>(
  `workflow:detail:${route.params.id}`,
  async () => {
    const workflowId = route.params.id as string;
    const [workflow, versions, runs] = await Promise.all([
      $fetch<Tables<"workflows">>(`/api/workflows/${workflowId}`, { headers }),
      $fetch<Tables<"workflow_versions">[]>(`/api/workflows/${workflowId}/versions`, { headers }),
      $fetch<Tables<"workflow_runs">[]>(`/api/workflows/${workflowId}/runs`, { headers }),
    ]);

    return {
      workflow: workflow ?? null,
      versions: versions ?? [],
      runs: (runs ?? []).slice(0, 10),
    };
  },
  {
    default: () => ({
      workflow: null,
      versions: [],
      runs: [],
    }),
  }
);

const workflow = computed(() => data.value.workflow);
const latestVersion = computed(() => data.value.versions[0] ?? null);
const runs = computed(() => data.value.runs);
const versions = computed(() => data.value.versions);

// Local state for active switch
const workflowIsActive = ref(false);
watch(
  workflow,
  (newVal) => {
    if (newVal) {
      workflowIsActive.value = newVal.is_active ?? false;
    }
  },
  { immediate: true }
);

// Tabs
const items = computed(() => [
  {
    label: t("workflows.tabs.versions"),
    slot: "versions",
  },
  {
    label: t("workflows.tabs.runs"),
    slot: "runs",
  },
]);

// Version table columns
const versionColumns = computed(() => [
  { id: "version", key: "version", label: t("workflows.versions.version") },
  { id: "published", key: "published", label: t("workflows.versions.published") },
  { id: "created_at", key: "created_at", label: t("common.created_at") },
  { id: "actions", key: "actions", label: t("common.actions") },
]);

// Run table columns
const runColumns = computed(() => [
  { id: "status", key: "status", label: t("workflows.runs.status") },
  { id: "lead_id", key: "lead_id", label: t("leads.lead") },
  { id: "started_at", key: "started_at", label: t("workflows.runs.started") },
  { id: "finished_at", key: "finished_at", label: t("workflows.runs.finished") },
  { id: "actions", key: "actions", label: t("common.actions") },
]);

// Actions
const exportLatest = () => {
  if (!latestVersion.value) return;
  const blob = new Blob([JSON.stringify(latestVersion.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `workflow-${workflow.value?.name ?? "export"}-v${
    latestVersion.value.version
  }.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const { runWorkflow } = useWorkflowRunner();
const runConsole = useRunConsole();

const runManualOpenDrawer = async () => {
  if (!workflow.value) return;

  runConsole.toggle(true);
  try {
    await runWorkflow(workflow.value.id, {
      getNodes: () => [],
      setNodes: () => {},
    });
  } catch (e) {
    console.error("Run failed", e);
  }
};

const confirmDelete = async () => {
  if (confirm(t("common.delete") + "?")) {
    await $fetch(`/api/workflows/${route.params.id}`, {
      method: "DELETE",
    });
    navigateTo("/app/workflows");
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

const isMobileDrawerOpen = ref(false);
</script>

<template>
  <div v-if="workflow" class="p-4 md:p-6 lg:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ workflow.name }}
        </h1>
        <UBadge color="neutral" variant="subtle">{{
          workflow.trigger_type
        }}</UBadge>
        <UBadge
          :color="workflow.is_active ? 'success' : 'error'"
          variant="subtle"
        >
          {{ workflow.is_active ? t("common.active") : t("common.inactive") }}
        </UBadge>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          :to="`/app/workflows/${workflow.id}/edit`"
          color="primary"
          variant="solid"
          :label="t('common.edit')"
        />
        <UButton
          color="neutral"
          variant="soft"
          :label="t('common.export_json')"
          @click="exportLatest"
        />
      </div>
    </div>

    <!-- Layout -->
    <div class="lg:grid lg:grid-cols-[1fr_360px] gap-6">
      <!-- Left Column -->
      <div class="space-y-6 min-w-0">
        <!-- Overview Card -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t("workflows.tabs.overview") }}
            </h3>
          </template>

          <div class="space-y-6">
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-git-branch"
                  class="w-5 h-5 text-gray-500"
                />
                <div>
                  <div class="text-sm text-gray-500">
                    {{ t("workflows.stats.latest_version") }}
                  </div>
                  <div class="font-semibold">
                    {{ latestVersion?.version ?? "-" }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-badge-check"
                  class="w-5 h-5 text-gray-500"
                />
                <div>
                  <div class="text-sm text-gray-500">
                    {{ t("workflows.stats.published") }}
                  </div>
                  <div class="font-semibold">
                    {{ latestVersion?.published ? "Yes" : "No" }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-activity" class="w-5 h-5 text-gray-500" />
                <div>
                  <div class="text-sm text-gray-500">
                    {{ t("workflows.stats.total_runs") }}
                  </div>
                  <div class="font-semibold">{{ runs.length }}</div>
                </div>
              </div>
            </div>

            <UDivider />

            <!-- Description -->
            <div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t("common.description") }}
              </div>
              <div class="mt-1 text-gray-600 dark:text-gray-400">
                {{ workflow.description || "-" }}
              </div>
            </div>

            <!-- Trust Note -->
            <div
              class="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400"
            >
              <UIcon
                name="i-lucide-shield-check"
                class="w-5 h-5 flex-shrink-0"
              />
              <span>{{ t("workflows.trust_note") }}</span>
            </div>
          </div>
        </UCard>

        <!-- Tabs -->
        <UTabs :items="items" class="w-full">
          <template #versions="{ item }">
            <UCard :ui="{ body: { padding: '!p-0' } }">
              <UTable :rows="versions" :columns="versionColumns">
                <template #published-data="{ row }">
                  <UIcon
                    v-if="row.published"
                    name="i-heroicons-check-circle-20-solid"
                    class="w-5 h-5 text-green-500"
                  />
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template #created_at-data="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
                <template #actions-data="{ row }">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons-ellipsis-horizontal-20-solid"
                  />
                </template>
              </UTable>
            </UCard>
          </template>

          <template #runs="{ item }">
            <UCard :ui="{ body: { padding: '!p-0' } }">
              <UTable :rows="runs" :columns="runColumns">
                <template #lead_id-data="{ row }">
                  {{ row.lead_id || "-" }}
                </template>
                <template #started_at-data="{ row }">
                  {{ formatDate(row.started_at) }}
                </template>
                <template #finished_at-data="{ row }">
                  {{ formatDate(row.finished_at) }}
                </template>
                <template #actions-data="{ row }">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    icon="i-heroicons-ellipsis-horizontal-20-solid"
                  />
                </template>
              </UTable>
            </UCard>
          </template>
        </UTabs>
      </div>

      <!-- Right Column (Desktop Sticky) -->
      <div class="hidden lg:flex flex-col gap-6 sticky top-6 h-fit">
        <ClientOnly>
          <!-- Status Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">
                {{ t("workflows.status.title") }}
              </h3>
            </template>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ t("common.active") }}</span>
                <UToggle v-model="workflowIsActive" />
              </div>
              <UDivider />
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{
                  t("workflows.trigger_type")
                }}</span>
                <span class="text-sm text-gray-500">{{
                  workflow.trigger_type
                }}</span>
              </div>
              <UDivider />
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{
                  t("common.last_updated")
                }}</span>
                <span class="text-sm text-gray-500">{{
                  formatDate(workflow.updated_at)
                }}</span>
              </div>
            </div>
          </UCard>

          <!-- Quick Actions -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">
                {{ t("common.quick_actions") }}
              </h3>
            </template>
            <div class="space-y-2">
              <UButton
                v-if="workflow.trigger_type === 'manual'"
                block
                color="primary"
                variant="soft"
                :label="t('workflows.actions.run_manual')"
                @click="runManualOpenDrawer"
              />
              <UButton
                block
                color="neutral"
                variant="outline"
                :label="t('workflows.actions.open_editor')"
                :to="`/app/workflows/${workflow.id}/edit`"
              />
            </div>
          </UCard>

          <!-- Danger Zone -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-red-500">
                {{ t("common.danger_zone") }}
              </h3>
            </template>
            <UButton
              block
              color="error"
              variant="soft"
              :label="t('common.delete')"
              @click="confirmDelete"
            />
          </UCard>
        </ClientOnly>
      </div>
    </div>

    <!-- Mobile Drawer Trigger -->
    <div class="fixed bottom-6 right-6 lg:hidden">
      <UButton
        icon="i-lucide-sliders-horizontal"
        color="primary"
        variant="solid"
        size="xl"
        :ui="{ rounded: 'rounded-full', padding: { xl: 'p-4' } }"
        @click="isMobileDrawerOpen = true"
      />
    </div>

    <!-- Run Details Drawer -->
    <WorkflowRunDrawer />

    <!-- Mobile Drawer -->
    <UDrawer v-model="isMobileDrawerOpen">
      <div class="p-4 space-y-6 h-full overflow-y-auto">
        <!-- Status Card -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t("workflows.status.title") }}
            </h3>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ t("common.active") }}</span>
              <UToggle v-model="workflowIsActive" />
            </div>
            <UDivider />
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{
                t("workflows.trigger_type")
              }}</span>
              <span class="text-sm text-gray-500">{{
                workflow.trigger_type
              }}</span>
            </div>
            <UDivider />
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{
                t("common.last_updated")
              }}</span>
              <span class="text-sm text-gray-500">{{
                formatDate(workflow.updated_at)
              }}</span>
            </div>
          </div>
        </UCard>

        <!-- Quick Actions -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t("common.quick_actions") }}
            </h3>
          </template>
          <div class="space-y-2">
            <UButton
              v-if="workflow.trigger_type === 'manual'"
              block
              color="primary"
              variant="soft"
              :label="t('workflows.actions.run_manual')"
              @click="runManualOpenDrawer"
            />
            <UButton
              block
              color="neutral"
              variant="outline"
              :label="t('workflows.actions.open_editor')"
              :to="`/app/workflows/${workflow.id}/edit`"
            />
          </div>
        </UCard>

        <!-- Danger Zone -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-500">
              {{ t("common.danger_zone") }}
            </h3>
          </template>
          <UButton
            block
            color="error"
            variant="soft"
            :label="t('common.delete')"
            @click="confirmDelete"
          />
        </UCard>
      </div>
    </UDrawer>
  </div>
</template>
