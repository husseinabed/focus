<script setup lang="ts">
import type { Tables } from "~/types/supabase";

// Page meta
definePageMeta({
  layout: "app",
 
});

const route = useRoute();
const headers = useRequestHeaders(["cookie"]);

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

const { t } = useI18n();

// Tabs
const tabs = computed(() => [
  {
    label: t("workflows.tabs.overview"),
    key: "overview",
  },
  {
    label: t("workflows.tabs.versions"),
    key: "versions",
  },
  {
    label: t("workflows.tabs.runs"),
    key: "runs",
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

// Placeholder functions
const exportLatestVersion = () => {
  // Implement export logic for the latest version
  console.log("Exporting latest version...");
};

const publishVersion = (id: string) => {
  // Implement publish logic for a specific version
  console.log(`Publishing version ${id}...`);
};

const unpublishVersion = (id: string) => {
  // Implement unpublish logic for a specific version
  console.log(`Unpublishing version ${id}...`);
};

const exportVersion = (id: string) => {
  // Implement export logic for a specific version
  console.log(`Exporting version ${id}...`);
};

const stopRun = (id: string) => {
  // Implement stop run logic
  console.log(`Stopping run ${id}...`);
};

const runManualWorkflow = () => {
  // Implement manual workflow run logic
  console.log("Running manual workflow...");
};

const confirmDeleteWorkflow = () => {
  // Implement delete workflow logic
  console.log("Confirming workflow deletion...");
};

const statusColor = (status: string) => {
  switch (status) {
    case "running":
      return "info";
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
};

const workflowVersions = computed(() => {
  if (latestVersion.value) {
    return [latestVersion.value];
  }
  return [];
});

const workflowRuns = computed(() => runs.value || []);
</script>

<template>
  <template v-if="!pending && !workflow">
    <div class="flex min-h-[60vh] items-center justify-center px-4">
      <div class="max-w-lg text-center">
        <h1 class="text-2xl font-bold">{{ t("workflows.detail.empty.title") }}</h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          {{ t("workflows.detail.empty.subtitle") }}
        </p>
        <NuxtLink
          to="/app/workflows"
          class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 dark:bg-primary-400 dark:hover:bg-primary-500"
        >
          {{ t("common.back") }}
        </NuxtLink>
      </div>
    </div>
  </template>
  <UMain v-else class="relative">
    <div class="relative flex-1 flex flex-col w-full">
      <!-- Header -->
      <div class="flex items-center justify-between pb-8">
   
        <div class="flex items-center gap-4">
          <h1 v-if="workflow" class="text-3xl font-bold">{{ workflow.name }}</h1>
          <UChip v-if="workflow" :text="workflow.trigger_type" variant="subtle" />
          <UChip
            v-if="workflow"
            :text="workflow.is_active ? t('common.active') : t('common.inactive')"
            :color="workflow.is_active ? 'success' : 'error'"
            variant="subtle"
          />
        </div>
        <div class="flex items-center gap-2">
          <UButton
            :to="`/app/workflows/${route.params.id}/edit`"
            :label="t('common.edit')"
            variant="solid"
            color="primary"
          />
          <UButton :label="t('common.export_json')" variant="soft" @click="exportLatestVersion" />
        </div>
      </div>

      <div class="lg:grid lg:grid-cols-[1fr_360px] gap-4 lg:gap-6 flex-1">
        <!-- Left Column: Overview and Tabs -->
        <div class="flex flex-col gap-4 lg:gap-6">
          <UCard>
            <template #header>
              <h2 class="text-xl font-bold">{{ t('workflows.tabs.overview') }}</h2>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UCard>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('workflows.stats.latest_version') }}</p>
                <p class="text-lg font-semibold">{{ latestVersion?.version || "N/A" }}</p>
              </UCard>
              <UCard>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('workflows.stats.published') }}</p>
                <p class="text-lg font-semibold">{{ latestVersion?.published ? t('common.yes') : t('common.no') }}</p>
              </UCard>
              <UCard>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('workflows.stats.total_runs') }}</p>
                <p class="text-lg font-semibold">{{ runs?.length || 0 }}</p>
              </UCard>
            </div>
            <USeparator class="my-4" />
            <div>
              <p class="text-sm font-semibold">{{ t('common.description') }}</p>
              <p v-if="workflow?.description">{{ workflow.description }}</p>
              <p v-else class="text-gray-500 dark:text-gray-400 italic">{{ t('workflows.overview.no_description') }}</p>
            </div>
            <USeparator class="my-4" />
            <div class="text-sm text-gray-500 dark:text-gray-400 italic">
              {{ t('workflows.trust_note') }}
            </div>
          </UCard>

          <UTabs :items="tabs" class="w-full">
            <template #item="{ item: { key } }">
              <div v-if="key === 'overview'" class="py-3">
                <!-- Overview content is already rendered above -->
              </div>
              <div v-else-if="key === 'versions'" class="py-3">
                <UTable :items="workflowVersions" :columns="versionColumns">
                  <template #published-data="{ row: versionRow }">
                    <UChip
                      :text="versionRow.published ? t('common.yes') : t('common.no')"
                      :color="versionRow.published ? 'success' : 'error'"
                      variant="subtle"
                    />
                  </template>
                  <template #actions-data="{ row: versionRow }">
                    <UButton v-if="!versionRow.published" :label="t('workflows.versions.publish')" variant="soft" @click="publishVersion(versionRow.id)" />
                    <UButton v-else :label="t('workflows.versions.unpublish')" variant="soft" @click="unpublishVersion(versionRow.id)" />
                    <UButton :label="t('common.export_json')" variant="soft" @click="exportVersion(versionRow.id)" />
                  </template>
                </UTable>
              </div>
              <div v-else-if="key === 'runs'" class="py-3">
                <UTable :items="workflowRuns" :columns="runColumns">
                  <template #status-data="{ row: runRow }">
                    <UChip :text="runRow.status" :color="statusColor(runRow.status)" variant="subtle" />
                  </template>
                  <template #lead_id-data="{ row: runRow }">
                    <span v-if="runRow.lead_id">{{ runRow.lead_id }}</span>
                    <span v-else class="text-gray-500 dark:text-gray-400">—</span>
                  </template>
                  <template #actions-data="{ row: runRow }">
                    <UButton :to="`/app/workflows/runs/${runRow.id}`" :label="t('common.open')" variant="soft" />
                    <UButton v-if="runRow.status === 'running'" :label="t('workflows.runs.stop')" variant="soft" color="error" @click="stopRun(runRow.id)" />
                  </template>
                </UTable>
              </div>
            </template>
          </UTabs>
        </div>

        <!-- Right Column: Sticky Actions + Status (Mobile: Drawer) -->
        <div class="relative hidden lg:block">
          <div class="sticky top-0 space-y-4">
            <UCard >
              <template #header>
                <h2 class="text-xl font-bold">{{ t('workflows.status.title') }}</h2>
              </template>
              <div class="space-y-2" v-if="workflow">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-semibold">{{ t('common.active') }}</span>
                  <USwitch v-model="workflow.is_active" />
                </div>
                <USeparator />
                <div class="flex justify-between items-center">
                  <span class="text-sm font-semibold">{{ t('workflows.trigger_type') }}</span>
                  <span>{{ workflow.trigger_type }}</span>
                </div>
                <USeparator />
                <div class="flex justify-between items-center">
                  <span class="text-sm font-semibold">{{ t('common.last_updated') }}</span>
                  <span>{{ new Date(workflow.updated_at).toLocaleDateString() }}</span>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h2 class="text-xl font-bold">{{ t('common.quick_actions') }}</h2>
              </template>
              <div class="flex flex-col gap-2">
                <UButton
                  v-if="workflow?.trigger_type === 'manual'"
                  :label="t('workflows.actions.run_manual')"
                  variant="soft"
                  @click="runManualWorkflow"
                />
                <UButton :to="`/app/workflows/${route.params.id}/edit`" :label="t('workflows.actions.open_editor')" variant="soft" />
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h2 class="text-xl font-bold">{{ t('common.danger_zone') }}</h2>
              </template>
              <div class="flex flex-col gap-2">
                <UButton :label="t('common.delete')" variant="soft" color="error" @click="confirmDeleteWorkflow" />
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>
  </UMain>
</template>

<style scoped>
/* Add any specific styles here */
</style>
 
