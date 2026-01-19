<template>
  <div class="h-screen p-4" :dir="localeProperties?.dir === 'rtl' ? 'rtl' : 'ltr'">
    <WorkflowPageHeader
      :title="workflowState.name || t('ui.workflows.editor.v1.page.title')"
      :subtitle="'ui.workflows.editor.v1.ui.header.subtitle'"
      :meta="headerMeta"
      :actions="headerActions"
    />

    <!-- <WorkflowTabs
      v-model="uiState.active_tab"
      :items="[
        { id: 'designer', label: { en: 'ui.workflows.editor.v1.tabs.designer' } },
        { id: 'runs', label: { en: 'ui.workflows.editor.v1.tabs.runs' } },
        { id: 'settings', label: { en: 'ui.workflows.editor.v1.tabs.settings' } },
      ]"
      class="mt-4 mb-4 mx-auto max-w-[1600px]"
    /> -->

    <div class="workflow-canvas border-muted border mt-2">
      <div
        v-if="uiState.active_tab === 'designer'"
        class="flex h-full"
        :style="{
          paddingBottom: (consoleState.open ? consoleState.height + 120 : 88) + 'px',
        }"
      >
        <div class="w-85 h-full p-6 border-muted border-e">
          <WorkflowNodePalette
            v-model:search="uiState.search_palette"
            :groups="paletteGroups"
            @drop-node="canvasActions.add_node"
          />
        </div>
        <div class="flex-1 h-full">
          <WorkflowFlowCanvas
            :nodes="workflowState.definition.nodes"
            :edges="workflowState.definition.edges"
            :options="{
              snapToGrid: uiState.snap_to_grid,
              showMiniMap: uiState.show_minimap,
              showControls: uiState.show_controls,
              defaultZoom: uiState.zoom,
            }"
            :validation="{
              errors: validationState.errors,
              warnings: validationState.warnings,
            }"
            :empty="workflowState.definition.nodes.length === 0"
            @node-select="canvasActions.select_node"
            @edge-select="canvasActions.select_edge"
            @node-move="canvasActions.update_node_position"
            @connect="canvasActions.connect"
            @node-drop="canvasActions.add_node"
            @delete="canvasActions.delete_items"
          >
            <template #emptyCanvas>
              <div class="h-full w-full flex items-center justify-center p-6">
                <UCard class="max-w-lg w-full">
                  <template #header>
                    <div class="text-lg font-semibold">Start your workflow</div>
                  </template>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Drag nodes from the palette or pick a trigger to begin.
                  </p>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <UButton
                      v-for="node in paletteGroups.triggers.slice(0, 3)"
                      :key="node.type"
                      :label="node.name || node.type"
                      color="neutral"
                      variant="soft"
                      @click="canvasActions.add_node({ type: node.type })"
                    />
                  </div>
                </UCard>
              </div>
            </template>
          </WorkflowFlowCanvas>
        </div>
        <div class="w-85 h-full p-6 border-muted border-s">
          <WorkflowNodeInspector
            :selected-node="selectedNode"
            :node-schema="selectedNodeSchema"
          />
        </div>

        <!-- ✅ Fixed Bottom Run Console Dock (Designer tab only)
             Insert inside the designer tab container (same scope as uiState/consoleState/uiState.running)
             Recommended insertion point: near the end of the designer tab (after palette/canvas/inspector columns)
        -->
        <WorkflowRunConsoleDock
          :active="uiState.active_tab === 'designer'"
          :running="uiState.running"
          :open="consoleState.open"
          :height="consoleState.height"
          :items="consoleState.items"
          @clear="consoleClear()"
          @go-runs="uiState.active_tab = 'runs'"
          @open-change="(v) => (consoleState.open = v)"
          @height-change="(h) => (consoleState.height = h)"
        />
      </div>

      <div v-else-if="uiState.active_tab === 'runs'" class="h-full overflow-y-auto p-6">
        <div class="max-w-3xl space-y-6">
          <UCard class="w-full">
            <template #header>
              <div>
                <div class="text-lg font-semibold">Run Input</div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Latest version: {{ latestVersion?.version ?? "N/A" }}
                </p>
              </div>
            </template>
            <div class="space-y-4">
              <UFormField label="Workflow version ID" class="w-full">
                <UInput v-model="runState.workflow_version_id" class="w-full" />
              </UFormField>
              <UFormField label="Lead ID" class="w-full">
                <UInput v-model="runState.lead_id" class="w-full" />
              </UFormField>
              <UFormField label="Input JSON" class="w-full">
                <UTextarea v-model="runState.input" :rows="6" class="w-full" />
              </UFormField>
              <div class="flex justify-end">
                <UButton
                  :label="t('common.run')"
                  color="neutral"
                  variant="solid"
                  :loading="uiState.running"
                  @click="workflowActions.run"
                />
              </div>
            </div>
          </UCard>

          <UCard class="w-full">
            <template #header>
              <div class="text-lg font-semibold">Run Response</div>
            </template>
            <pre v-if="runState.output" class="text-xs whitespace-pre-wrap">{{
              JSON.stringify(runState.output, null, 2)
            }}</pre>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              No run output yet.
            </p>
          </UCard>
        </div>
      </div>

      <div
        v-else-if="uiState.active_tab === 'settings'"
        class="h-full overflow-y-auto p-6"
      >
        <div class="max-w-2xl">
          <UCard class="w-full">
            <template #header>
              <div class="text-lg font-semibold">Workflow Settings</div>
            </template>
            <div class="space-y-4">
              <UFormField :label="t('common.name')" class="w-full">
                <UInput v-model="workflowState.name" class="w-full" />
              </UFormField>
              <UFormField :label="t('common.description')" class="w-full">
                <UTextarea v-model="workflowState.description" :rows="4" class="w-full" />
              </UFormField>
              <UFormField label="Trigger Type" class="w-full">
                <USelect
                  v-model="workflowState.trigger_type"
                  :items="triggerTypeItems"
                  value-attribute="value"
                  label-attribute="label"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Active" class="w-full">
                <USwitch v-model="workflowState.is_active" />
              </UFormField>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- <WorkflowStickyStatusBar
      :left="[
        { component: WorkflowToggle as any, props: { label: 'Snap', modelValue: uiState.snap_to_grid, 'onUpdate:modelValue': (val: boolean) => (uiState.snap_to_grid = val) } },
        { component: WorkflowToggle as any, props: { label: 'MiniMap', modelValue: uiState.show_minimap, 'onUpdate:modelValue': (val: boolean) => (uiState.show_minimap = val) } },
        { component: WorkflowToggle as any, props: { label: 'Controls', modelValue: uiState.show_controls, 'onUpdate:modelValue': (val: boolean) => (uiState.show_controls = val) } },
      ]"
      :right="[
        { component: UBadge as any, props: { label: selectionLabel } },
        { component: UBadge as any, props: { label: runStatus } },
      ]"
    /> -->

    <UModal v-model:open="isImportModalOpen" :title="t('common.import_json')">
      <template #body>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">{{ t("common.import_json") }}</h3>
          </template>
          <UTextarea
            v-model="importJsonContent"
            placeholder="Paste workflow JSON here..."
            :rows="10"
            class="w-full"
          />
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                :label="t('common.cancel')"
                color="neutral"
                variant="ghost"
                @click="isImportModalOpen = false"
              />
              <UButton
                :label="t('common.import')"
                color="neutral"
                variant="solid"
                @click="handleImportWorkflowJson"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Tables } from "~/types/supabase";
import { UBadge, WorkflowToggle } from "#components";
import { createFlowNodeFromSchema, getTranslation } from "~/utils/workflow";
import { canConnect } from "~/types/workflow_editor";
import type { Connection } from "@vue-flow/core";

const route = useRoute();
const workflowId = route.params.id as string;
const { t, localeProperties } = useI18n();
const toast = useToast();
const { runWorkflow } = useWorkflowRunner();

const nodesCatalog = ref<any[]>([]);
const latestVersion = ref<any | null>(null);
const isHydrating = ref(true);
const isImportModalOpen = ref(false);
const importJsonContent = ref("");

type ConsoleEntry = {
  id: string;
  type: "started" | "ping" | "node" | "finished" | "error";
  ts: string;
  nodeId?: string;
  nodeType?: string;
  status?: string;
  message?: string;
  output?: any;
  payload?: any;
};

type RuntimeStatus = "idle" | "running" | "success" | "fail";
type RuntimeState = {
  status: RuntimeStatus;
  startedAt?: string;
  finishedAt?: string;
  lastError?: string;
};

const runtime = reactive<RuntimeState>({
  status: "idle",
});

const consoleState = reactive({
  open: false,
  height: 260,
  items: [] as ConsoleEntry[],
  max: 300,
});

const designerBottomPad = computed(() =>
  consoleState.open ? consoleState.height + 80 : 80
);

function consolePush(entry: ConsoleEntry) {
  consoleState.items.push(entry);
  if (consoleState.items.length > consoleState.max) {
    consoleState.items.splice(0, consoleState.items.length - consoleState.max);
  }
}

function consoleClear() {
  consoleState.items.splice(0, consoleState.items.length);
}

// 4) CREATE a proper handler for workflow runner events (NOT "onEvent(event)" inside run)
function handleRunEvent(runEvent: any) {
  // runEvent is your RunEvent from SSE: { nodeId, nodeType, status, output?, error?, timestamp }
  consolePush({
    id: uuid(),
    type: "node",
    ts: runEvent?.timestamp || new Date().toISOString(),
    nodeId: runEvent?.nodeId,
    nodeType: runEvent?.nodeType,
    status: runEvent?.status,
    message: runEvent?.error,
    output: runEvent?.output,
    payload: runEvent,
  });

  // open dock on first event
  consoleState.open = true;
}
const uiState = reactive({
  dirty: false,
  saving: false,
  running: false,
  active_tab: "designer",
  inspector_open: true,
  palette_open: true,
  snap_to_grid: true,
  show_minimap: true,
  show_controls: true,
  zoom: 1,
  selected_node_id: null as string | null,
  selected_edge_id: null as string | null,
  search_palette: "",
});

const workflowState = reactive<
  Partial<Tables<"workflows">> & {
    definition: { version: number; nodes: any[]; edges: any[] };
  }
>({
  id: workflowId,
  name: "",
  description: "",
  trigger_type: "manual",
  is_active: false,
  definition: {
    version: 1,
    nodes: [],
    edges: [],
  },
});

const validationState = reactive({
  status: "unknown" as "unknown" | "valid" | "invalid",
  errors: [] as { id: string; message: string; node_id?: string; edge_id?: string }[],
  warnings: [] as { id: string; message: string; node_id?: string; edge_id?: string }[],
});

const runState = reactive({
  workflow_version_id: null as string | null,
  lead_id: "",
  input: "{}",
  output: null as Record<string, any> | null,
  last_run_id: null as string | null,
});

const triggerTypeItems = [
  { label: "Manual", value: "manual" },
  { label: "Lead Added", value: "lead_added" },
  { label: "Inbound Reply", value: "inbound_reply" },
  { label: "Scheduled", value: "scheduled" },
];

const { data, refresh } = await useAsyncData(
  `workflow:editor:${workflowId}`,
  async () => {
    const [workflow, versions, catalog] = await Promise.all([
      $fetch(`/api/workflows/${workflowId}`),
      $fetch(`/api/workflows/${workflowId}/versions`),
      $fetch(`/api/workflow-nodes/catalog`),
    ]);

    const latest = Array.isArray(versions) ? versions[0] : null;
    return {
      workflow,
      latestVersion: latest,
      catalog,
    };
  }
);

onBeforeMount(refresh); // refresh on page reload

watch(
  () => data.value,
  (value) => {
    if (!value) return;
    isHydrating.value = true;

    if (value.workflow) {
      Object.assign(workflowState, value.workflow);
    }

    if (value.latestVersion) {
      latestVersion.value = value.latestVersion;
      workflowState.definition.version = value.latestVersion.schema_version ?? 1;
      workflowState.definition.nodes = value.latestVersion.graph?.nodes || [];
      workflowState.definition.edges = value.latestVersion.graph?.edges || [];
      runState.workflow_version_id = value.latestVersion.id || null;
    } else {
      latestVersion.value = null;
      workflowState.definition.nodes = [];
      workflowState.definition.edges = [];
    }

    if (value.catalog) {
      nodesCatalog.value = value.catalog.items || value.catalog;
    }

    nextTick(() => {
      isHydrating.value = false;
      uiState.dirty = false;
    });
  },
  { immediate: true }
);

watch(
  () => workflowState.definition,
  () => {
    if (!isHydrating.value) {
      uiState.dirty = true;
    }
  },
  { deep: true }
);

watch(
  () => [
    workflowState.name,
    workflowState.description,
    workflowState.trigger_type,
    workflowState.is_active,
  ],
  () => {
    if (!isHydrating.value) {
      uiState.dirty = true;
    }
  }
);

const findById = (collection: any[], id: string | null) =>
  collection.find((item) => item.id === id) || null;

const catalogSchemaFor = (nodeType: string) => {
  const node = nodesCatalog.value.find((n: any) => n.type === nodeType);
  return node?.schema || node || {};
};

const filterCatalog = (catalog: any[], category: string, search: string) => {
  if (!catalog) return [];
  return catalog.filter(
    (item) =>
      item.category === category &&
      (item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.type?.toLowerCase().includes(search.toLowerCase()))
  );
};

const selectedNode = computed(() =>
  findById(workflowState.definition.nodes, uiState.selected_node_id)
);
const selectedNodeSchema = computed(() =>
  selectedNode.value ? catalogSchemaFor(selectedNode.value.type) : {}
);

const paletteGroups = computed(() => ({
  triggers: filterCatalog(nodesCatalog.value, "trigger", uiState.search_palette),
  actions: filterCatalog(nodesCatalog.value, "actions", uiState.search_palette),
  // messaging: filterCatalog(nodesCatalog.value, "messaging", uiState.search_palette),
  // logic: filterCatalog(nodesCatalog.value, "logic", uiState.search_palette),
  // meetings: filterCatalog(nodesCatalog.value, "meetings", uiState.search_palette),
}));

const selectionLabel = computed(() =>
  uiState.selected_node_id
    ? "Node selected"
    : uiState.selected_edge_id
    ? "Edge selected"
    : "No selection"
);

const runStatus = computed(() => (uiState.running ? "Running..." : "Idle"));

const validationLabel = computed(() => {
  if (validationState.status === "valid") {
    return { text: "Valid", tone: "success" };
  }
  if (validationState.status === "invalid") {
    return { text: "Invalid", tone: "error" };
  }
  return { text: "Not checked", tone: "neutral" };
});

const headerMeta = computed(() => [
  {
    type: "Chip",
    text: workflowState.is_active ? "Active" : "Draft",
    tone: workflowState.is_active ? "success" : "neutral",
  },
  {
    type: "Chip",
    text: validationLabel.value.text,
    tone: validationLabel.value.tone,
  },
  { type: "Chip", visibleWhen: { expr: uiState.dirty }, text: "Unsaved" },
]);

const uuid = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

const validateDefinition = () => {
  const errors: { id: string; message: string; node_id?: string }[] = [];
  const warnings: { id: string; message: string; node_id?: string }[] = [];

  const nodes = workflowState.definition.nodes || [];
  const edges = workflowState.definition.edges || [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  const hasTrigger = nodes.some(
    (node) =>
      node.category === "trigger" ||
      String(node.type || "")
        .toLowerCase()
        .includes("trigger")
  );

  if (!hasTrigger) {
    errors.push({
      id: "missing-trigger",
      message: "Add a trigger node to start the workflow.",
    });
  }

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push({
        id: `dangling-${edge.id}`,
        message: "Remove dangling edges.",
        edge_id: edge.id,
      });
    }
  });

  nodes.forEach((node) => {
    const connected = edges.some(
      (edge) => edge.source === node.id || edge.target === node.id
    );
    if (!connected && nodes.length > 1) {
      warnings.push({
        id: `isolated-${node.id}`,
        message: "Node is not connected.",
        node_id: node.id,
      });
    }
  });

  validationState.errors = errors;
  validationState.warnings = warnings;
  validationState.status = errors.length > 0 ? "invalid" : "valid";
};

// helper: reset nodes runtime + runtime state
const resetRuntime = () => {
  workflowState.definition.nodes = (workflowState.definition.nodes || []).map((node) => ({
    ...node,
    data: {
      ...(node.data ?? {}),
      runtime: {
        ...(node.data?.runtime ?? {}),
        status: "idle",
        lastEvent: undefined,
        error: undefined,
      },
    },
  }));

  runtime.status = "idle";
  runtime.startedAt = undefined;
  runtime.finishedAt = undefined;
  runtime.lastError = undefined;
};

const workflowActions = {
  save: async () => {
    uiState.saving = true;
    try {
      await $fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        body: {
          name: workflowState.name,
          description: workflowState.description,
          is_active: workflowState.is_active,
          trigger_type: workflowState.trigger_type,
        },
      });

      const version: any = await $fetch(`/api/workflows/${workflowId}/versions`, {
        method: "POST",
        body: {
          graph: {
            nodes: workflowState.definition.nodes,
            edges: workflowState.definition.edges,
          },
          schema_version: workflowState.definition.version,
        },
      });

      latestVersion.value = version;
      runState.workflow_version_id = version?.id || runState.workflow_version_id;
      uiState.dirty = false;
      toast.add({
        title: t("common.save"),
        description: "Workflow saved.",
        color: "success",
      });
    } catch (error) {
      toast.add({ title: t("common.save"), description: "Save failed.", color: "error" });
    } finally {
      uiState.saving = false;
    }
  },

  validate: () => {
    validateDefinition();
    toast.add({
      title: "Validation",
      description: "Validation complete.",
      color: "info",
    });
  },

  run: async () => {
    let input: Record<string, any> = {};
    try {
      input = runState.input?.trim() ? JSON.parse(runState.input) : {};
    } catch {
      toast.add({ title: "Run", description: "Input JSON is invalid.", color: "error" });
      return;
    }

    try {
      // reset visual runtime + console
      resetRuntime();
      consoleClear();

      // console "started"
      const startedAt = new Date().toISOString();
      runtime.status = "running";
      runtime.startedAt = startedAt;
      consolePush({ id: uuid(), type: "started", ts: startedAt, payload: { startedAt } });

      uiState.running = true;

      const result = await runWorkflow(workflowId, {
        getNodes: () => workflowState.definition.nodes,
        setNodes: (nodes) => {
          workflowState.definition.nodes = nodes;
        },
        input,
        // ✅ IMPORTANT: useWorkflowRunner MUST support this callback
        // If it doesn't yet, add it there (see note below).
        onEvent: handleRunEvent,
      } as any);

      // finished ok
      const finishedAt = new Date().toISOString();
      runtime.status = result?.status === "fail" ? "fail" : "success";
      runtime.finishedAt = finishedAt;
      runtime.lastError = result?.status === "fail" ? "Run failed" : undefined;

      consolePush({ id: uuid(), type: "finished", ts: finishedAt, payload: result });
      runState.output = result as any;

      toast.add({ title: "Run", description: "Run completed.", color: "success" });
    } catch (err: any) {
      const finishedAt = new Date().toISOString();
      runtime.status = "fail";
      runtime.finishedAt = finishedAt;
      runtime.lastError = err?.message || "Workflow run failed.";

      consolePush({
        id: uuid(),
        type: "error",
        ts: finishedAt,
        message: runtime.lastError,
        payload: { message: runtime.lastError },
      });

      toast.add({ title: "Run", description: "Run failed.", color: "error" });
    } finally {
      uiState.running = false;
    }
  },

  export_json: () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(workflowState.definition, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `${workflowState.name || "workflow"}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.add({
      title: t("common.export_json"),
      description: "Exported workflow JSON.",
      color: "success",
    });
  },

  import_json: () => {
    isImportModalOpen.value = true;
  },

  clear: () => {
    if (confirm("Clear the workflow canvas?")) {
      workflowState.definition.nodes = [];
      workflowState.definition.edges = [];
      uiState.dirty = true;
      toast.add({
        title: t("common.clear"),
        description: "Workflow cleared.",
        color: "info",
      });
    }
  },
};

const handleImportWorkflowJson = () => {
  try {
    const imported = JSON.parse(importJsonContent.value);
    if (imported && imported.nodes && imported.edges) {
      workflowState.definition.nodes = imported.nodes;
      workflowState.definition.edges = imported.edges;
      uiState.dirty = true;
      isImportModalOpen.value = false;
      toast.add({
        title: t("common.import_json"),
        description: "Workflow imported.",
        color: "success",
      });
    } else {
      toast.add({
        title: t("common.import_json"),
        description: "Invalid workflow JSON.",
        color: "error",
      });
    }
  } catch (error) {
    toast.add({
      title: t("common.import_json"),
      description: "Invalid JSON.",
      color: "error",
    });
  }
};

const headerActions = computed(() => [
  {
    type: "UButton",
    label: t("common.save"),
    variant: "solid",
    color: "neutral",
    loadingFrom: () => uiState.saving,
    action: workflowActions.save,
  },
  {
    type: "UButton",
    label: t("common.validate"),
    variant: "outline",
    color: "neutral",
    action: workflowActions.validate,
  },
  {
    type: "UButton",
    label: t("common.run"),
    variant: "outline",
    color: "neutral",
    loadingFrom: () => uiState.running,
    action: workflowActions.run,
  },
  {
    type: "UDropdown",
    label: t("common.json"),
    items: [
      { label: t("common.export_json"), click: workflowActions.export_json },
      { label: t("common.import_json"), click: workflowActions.import_json },
    ],
  },
  {
    type: "UButton",
    label: t("common.clear"),
    variant: "ghost",
    color: "neutral",
    action: workflowActions.clear,
  },
  {
    type: "UButton",
    label: t("common.back"),
    variant: "ghost",
    color: "neutral",
    icon: "i-lucide-arrow-big-left-dash",
    action: () => navigateTo("/app/workflows"),
  },
]);

const canvasActions = {
  add_node: (payload: { type: string; position?: { x: number; y: number } }) => {
    const schema = nodesCatalog.value.find((n: any) => n.type === payload.type);
    if (!schema) {
      toast.add({
        title: "Error",
        description: `Unknown node type: ${payload.type}`,
        color: "danger",
      });
      return;
    }
    const newNode = createFlowNodeFromSchema(
      schema,
      payload.position || { x: 540, y: 240 }
    );
    newNode.data.label = getTranslation(
      schema.title,
      localeProperties.value?.code || "en"
    );
    workflowState.definition.nodes.push(newNode);
  },

  select_node: (payload: { node_id: string }) => {
    uiState.selected_node_id = payload.node_id;
    uiState.selected_edge_id = null;
  },

  select_edge: (payload: { edge_id: string }) => {
    uiState.selected_edge_id = payload.edge_id;
    uiState.selected_node_id = null;
  },

  update_node_position: (payload: {
    node_id: string;
    position: { x: number; y: number };
  }) => {
    const node = findById(workflowState.definition.nodes, payload.node_id);
    if (node) {
      node.position = payload.position;
    }
  },

  connect: (payload: Connection) => {
    const sourceNode = workflowState.definition.nodes.find(
      (n) => n.id === payload.source
    );
    const targetNode = workflowState.definition.nodes.find(
      (n) => n.id === payload.target
    );

    if (!sourceNode || !targetNode) {
      toast.add({
        title: "Connection Error",
        description: "Source or target node not found.",
        color: "error",
      });
      return;
    }

    const sourceSchema = sourceNode.data.schema || catalogSchemaFor(sourceNode.type);
    const targetSchema = targetNode.data.schema || catalogSchemaFor(targetNode.type);

    if (!sourceSchema?.ports || !targetSchema?.ports) {
      toast.add({
        title: "Connection Error",
        description: "Node schemas not found.",
        color: "error",
      });
      return;
    }

    const sourceHandleId = payload.sourceHandle ?? sourceSchema.ports.outputs[0]?.id;
    const targetHandleId = payload.targetHandle ?? targetSchema.ports.inputs[0]?.id;

    const newEdge = {
      id: uuid(),
      source: payload.source,
      target: payload.target,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
    };

    const sourcePort = sourceSchema.ports.outputs.find((p) => p.id === sourceHandleId);
    const targetPort = targetSchema.ports.inputs.find((p) => p.id === targetHandleId);

    if (!sourcePort || !targetPort) {
      toast.add({
        title: "Connection Error",
        description: "Source or target port not found.",
        color: "error",
      });
      return;
    }

    // Validate connection using the canConnect utility
    if (!canConnect(sourcePort, targetPort)) {
      toast.add({
        title: "Connection Error",
        description: `Cannot connect ${sourcePort.dataType} to ${targetPort.dataType}. Type mismatch.`,
        color: "danger",
      });
      return;
    }

    workflowState.definition.edges.push(newEdge);
  },

  delete_items: (payload: { nodes: string[]; edges: string[] }) => {
    if (payload.nodes?.length) {
      const deletedNodeIds = new Set(payload.nodes);
      workflowState.definition.nodes = workflowState.definition.nodes.filter(
        (node) => !deletedNodeIds.has(node.id)
      );
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) => !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target)
      );
    }

    if (payload.edges?.length) {
      const deletedEdgeIds = new Set(payload.edges);
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) => !deletedEdgeIds.has(edge.id)
      );
    }

    if (payload.nodes?.includes(uiState.selected_node_id || "")) {
      uiState.selected_node_id = null;
    }
    if (payload.edges?.includes(uiState.selected_edge_id || "")) {
      uiState.selected_edge_id = null;
    }
  },

  delete_selection: () => {
    if (uiState.selected_node_id) {
      workflowState.definition.nodes = workflowState.definition.nodes.filter(
        (node) => node.id !== uiState.selected_node_id
      );
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) =>
          edge.source !== uiState.selected_node_id &&
          edge.target !== uiState.selected_node_id
      );
    } else if (uiState.selected_edge_id) {
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) => edge.id !== uiState.selected_edge_id
      );
    }
    uiState.selected_node_id = null;
    uiState.selected_edge_id = null;
  },
};
</script>

<style scoped>
.workflow-canvas {
  display: flex;
  flex-direction: column;
  height: calc(100% - 200px);
  background-color: var(--color-gray-50);
  overflow-y: auto;
}
</style>
