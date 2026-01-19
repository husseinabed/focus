<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import type { Tables, TablesInsert } from "~/types/supabase";
import { useAuth } from "~/composables/useAuth";
import { useI18n } from "vue-i18n";
import { useRoute } from "#app"; // Removed definePageMeta

// Imported components
import WorkflowPageHeader from "~/components/workflow/WorkflowPageHeader.vue";
import WorkflowTabs from "~/components/workflow/WorkflowTabs.vue";
import WorkflowPanel from "~/components/workflow/WorkflowPanel.vue";
import FlowCanvas from "~/components/workflow/FlowCanvas.vue";
import EmptyCanvasCta from "~/components/workflow/EmptyCanvasCta.vue";
import NodeForm from "~/components/workflow/NodeForm.vue";
import WorkflowSummary from "~/components/workflow/WorkflowSummary.vue";
import ValidationOverlay from "~/components/workflow/ValidationOverlay.vue";
import RunPanel from "~/components/workflow/RunPanel.vue";
import RunInput from "~/components/workflow/RunInput.vue";
import RunOutput from "~/components/workflow/RunOutput.vue";
import RunLogsLink from "~/components/workflow/RunLogsLink.vue";
import SettingsPanel from "~/components/workflow/SettingsPanel.vue";
import StickyStatusBar from "~/components/workflow/StickyStatusBar.vue";
import Toggle from "~/components/workflow/Toggle.vue";
import NodeInspector from "~/components/workflow/NodeInspector.vue";
import NodePalette from "~/components/workflow/NodePalette.vue";
// Removed import ThreePanel from "~/components/ThreePanel.vue";

definePageMeta({
  layout: "app",
  // middleware: "auth",
});

const route = useRoute();
const workflowId = route.params.id as string;
const { t, localeProperties } = useI18n();
const { user } = useAuth();
const toast = useToast();

// Reactive State from workflow_editor.json
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

const workflowState = reactive<Tables<"workflows"> & { definition: { version: number, nodes: any[], edges: any[] }, status: "draft" | "active" | "paused" | "archived" }>({
  id: null as string | null,
  name: "",
  status: "draft",
  description: "",
  tags: [],
  definition: {
    version: 1,
    nodes: [],
    edges: [],
  },
});

const validationState = reactive({
  status: "unknown" as "unknown" | "valid" | "invalid",
  errors: [] as { id: string, message: string, node_id?: string }[],
  warnings: [] as { id: string, message: string, node_id?: string }[],
});

const runState = reactive({
  last_run_id: null as string | null,
  mode: "dry_run" as "dry_run" | "live_run",
  input: {} as Record<string, any>,
  output: null as Record<string, any> | null,
  logs_count: 0,
});

// --- Data Fetching ---
const nodesCatalog = ref<any[]>([]);

const { data, pending, error, refresh } = useAsyncData(
  `workflow:editor:${workflowId}`,
  async () => {
    const [workflow, latestVersion, catalog] = await Promise.all([
      $fetch(`/api/workflows/${workflowId}`),
      $fetch(`/api/workflows/${workflowId}/versions`),
      $fetch(`/api/workflow-nodes/catalog`),
    ]);

    if (workflow) {
      Object.assign(workflowState, workflow);
    }
    if (latestVersion && latestVersion[0]) {
      Object.assign(workflowState.definition, latestVersion[0].graph);
    }
    if (catalog) {
      nodesCatalog.value = catalog.items || catalog;
    }
    return { workflow, latestVersion: latestVersion[0], catalog };
  }
);

const isImportModalOpen = ref(false);
const importJsonContent = ref("");

// Utility Functions
const findById = (collection: any[], id: string | null) => {
  return collection.find((item) => item.id === id) || null;
};

const catalogSchemaFor = (nodeType: string) => {
  const node = nodesCatalog.value.find((n: any) => n.type === nodeType);
  return node ? node.schema : {};
};

const first = (collection: any[], predicate?: (item: any) => boolean) => {
  if (!collection || collection.length === 0) return null;
  if (predicate) {
    return collection.find(predicate) || null;
  }
  return collection[0];
};

const filterCatalog = (catalog: any[], category: string, search: string) => {
  if (!catalog) return [];
  return catalog.filter(
    (item) =>
      item.category === category &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase()))
  );
};

const hasTrigger = (nodes: any[]) => {
  return nodes.some((node) => node.category === "trigger");
};

const noDanglingEdges = (nodes: any[], edges: any[]) => {
  // Implement logic to check for dangling edges
  // For now, a mock
  return { valid: true, errors: [], warnings: [] };
};

const noIsolatedNodes = (nodes: any[], edges: any[]) => {
  // Implement logic to check for isolated nodes
  // For now, a mock
  return { valid: true, errors: [], warnings: [] };
};

const requiresApprovalBeforeSend = (nodes: any[], edges: any[]) => {
  // Implement logic to check for approval before send
  // For now, a mock
  return { valid: true, errors: [], warnings: [] };
};

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Computed properties
const selectedNode = computed(() => findById(workflowState.definition.nodes, uiState.selected_node_id));
const selectedNodeSchema = computed(() => selectedNode.value ? catalogSchemaFor(selectedNode.value.type) : {});
const triggerTitle = computed(() => first(workflowState.definition.nodes, (node:any) => node.category === 'trigger')?.title ?? 'None');
const selectionLabel = computed(() => uiState.selected_node_id ? 'Node selected' : (uiState.selected_edge_id ? 'Edge selected' : 'No selection'));
const runStatus = computed(() => uiState.running ? 'Running…' : 'Idle');
const paletteGroups = computed(() => ({
  triggers: filterCatalog(nodesCatalog.value, "trigger", uiState.search_palette),
  messaging: filterCatalog(nodesCatalog.value, "messaging", uiState.search_palette),
  logic: filterCatalog(nodesCatalog.value, "logic", uiState.search_palette),
  meetings: filterCatalog(nodesCatalog.value, "meetings", uiState.search_palette),
}));

// --- Actions ---
const workflowActions = {
  save: async () => {
    uiState.saving = true;
    try {
      const response = await $fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        body: { workflow: workflowState },
      });
      uiState.dirty = false;
      toast.add({ title: t("common.save"), description: "Workflow saved successfully!", color: "success" });
    } catch (e) {
      toast.add({ title: t("common.save"), description: "Save failed!", color: "error" });
    } finally {
      uiState.saving = false;
    }
  },

  validate: async () => {
    try {
      const response: any = await $fetch(`/api/workflows/${workflowId}/validate`, {
        method: "POST" as "POST", // Explicitly cast to literal type "POST"
        body: { definition: workflowState.definition },
      });
      Object.assign(validationState, response);
      toast.add({ title: "Validation", description: "Workflow validated!", color: "info" });
    } catch (e) {
      toast.add({ title: "Validation", description: "Validation failed!", color: "error" });
    }
  },

  run_dry: async () => {
    uiState.running = true;
    try {
      const response: any = await $fetch(`/api/workflows/${workflowId}/runs`, {
        method: "POST" as "POST", // Explicitly cast to literal type "POST"
        body: { mode: "dry_run", input: runState.input },
      });
      runState.last_run_id = response.run_id;
      runState.output = response.output;
      runState.logs_count = response.logs_count;
      toast.add({ title: "Run", description: "Dry run completed!", color: "success" });
    } catch (e) {
      toast.add({ title: "Run", description: "Dry run failed!", color: "error" });
    } finally {
      uiState.running = false;
    }
  },

  export_json: () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflowState.definition, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${workflowState.name || 'workflow'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.add({ title: t("common.export_json"), description: "Workflow exported successfully!", color: "success" });
  },

  import_json: () => {
    isImportModalOpen.value = true;
  },

  clear: () => {
    if (confirm(t("workflows.clear_confirm"))) {
      workflowState.definition.nodes = [];
      workflowState.definition.edges = [];
      uiState.dirty = true;
      toast.add({ title: "Clear", description: "Workflow cleared!", color: "info" });
    }
  },
};

const canvasActions = {
  add_node: (payload: { type: string, position?: { x: number, y: number } }) => {
    workflowState.definition.nodes.push({
      id: uuid(),
      type: payload.type,
      position: payload.position || { x: 540, y: 240 },
      data: {},
    });
    uiState.dirty = true;
  },

  select_node: (payload: { node_id: string }) => {
    uiState.selected_node_id = payload.node_id;
    uiState.selected_edge_id = null;
  },

  select_edge: (payload: { edge_id: string }) => {
    uiState.selected_edge_id = payload.edge_id;
    uiState.selected_node_id = null;
  },

  update_node_position: (payload: { node_id: string; position: { x: number; y: number } }) => {
    const node = findById(workflowState.definition.nodes, payload.node_id);
    if (node) {
      node.position = payload.position;
      uiState.dirty = true;
    }
  },

  connect: (payload: { source: string; target: string; sourceHandle: string; targetHandle: string }) => {
    workflowState.definition.edges.push({
      id: uuid(),
      source: payload.source,
      target: payload.target,
      sourceHandle: payload.sourceHandle,
      targetHandle: payload.targetHandle,
    });
    uiState.dirty = true;
  },

  delete_selection: () => {
    if (uiState.selected_node_id) {
      workflowState.definition.nodes = workflowState.definition.nodes.filter(
        (node) => node.id !== uiState.selected_node_id
      );
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) => edge.source !== uiState.selected_node_id && edge.target !== uiState.selected_node_id
      );
    } else if (uiState.selected_edge_id) {
      workflowState.definition.edges = workflowState.definition.edges.filter(
        (edge) => edge.id !== uiState.selected_edge_id
      );
    }
    uiState.selected_node_id = null;
    uiState.selected_edge_id = null;
    uiState.dirty = true;
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
      toast.add({ title: t("common.import_json"), description: "Workflow imported successfully!", color: "success" });
    } else {
      toast.add({ title: t("common.import_json"), description: "Invalid workflow JSON!", color: "error" });
    }
  } catch (e) {
    toast.add({ title: t("common.import_json"), description: "Failed to parse JSON!", color: "error" });
  }
};
</script>

<template>
  <div
    class="min-h-screen flex flex-col"
    :dir="localeProperties.value && localeProperties.value.direction === 'rtl' ? 'rtl' : 'ltr'"
  >
    <!-- Header -->
    <WorkflowPageHeader
      :title="workflowState.name || t('ui.workflows.editor.v1.page.title')"
      :subtitle="'ui.workflows.editor.v1.ui.header.subtitle'"
      :meta="[
        { type: 'Chip', bindTo: workflowState.status },
        { type: 'Chip', toneFrom: validationState.status, textFrom: validationState.status, map: { valid: { text: 'Valid', tone: 'success' }, invalid: { text: 'Invalid', tone: 'danger' }, unknown: { text: 'Not checked', tone: 'neutral' } } },
        { type: 'Chip', visibleWhen: { expr: uiState.dirty }, text: '● Unsaved' }
      ]"
      :actions="[
        { type: 'UButton', label: t('common.save'), variant: 'solid', color: 'neutral', loadingFrom: uiState.saving, action: workflowActions.save },
        { type: 'UButton', label: t('common.validate'), variant: 'outline', action: workflowActions.validate },
        { type: 'UButton', label: t('common.run'), variant: 'outline', loadingFrom: uiState.running, action: workflowActions.run_dry },
        {
          type: 'UDropdown',
          label: t('common.json'),
          items: [
            { label: t('common.export_json'), click: workflowActions.export_json },
            { label: t('common.import_json'), click: workflowActions.import_json }
          ]
        },
        { type: 'UButton', label: t('common.clear'), variant: 'ghost', action: workflowActions.clear }
      ]"
    />

    <!-- Tabs -->
    <WorkflowTabs
      v-model="uiState.active_tab"
      :items="[
        { id: 'designer', label: { en: 'ui.workflows.editor.v1.tabs.designer' } },
        { id: 'runs', label: { en: 'ui.workflows.editor.v1.tabs.runs' } },
        { id: 'settings', label: { en: 'ui.workflows.editor.v1.tabs.settings' } }
      ]"
      class="mt-4 mb-4 mx-auto max-w-[1600px]"
    />

    <!-- ThreePanel Layout -->
    <WorkflowPanel
      container-class="max-w-[1600px] mx-auto flex-1"
      inspector-side="left"
      inspector-width="w-[360px]"
      :inspector-collapsible="true"
      :inspector-default-open="uiState.inspector_open"
      palette-side="right"
      palette-width="w-[340px]"
      :palette-collapsible="true"
      :palette-default-open="uiState.palette_open"
    >
      <!-- Inspector Panel -->
      <template #inspector>
        <NodeInspector
          v-if="uiState.active_tab === 'designer'"
          :selected-node="selectedNode"
          :node-schema="selectedNodeSchema"
        />
      </template>

      <!-- Canvas Panel -->
      <template #canvas>
        <FlowCanvas
          v-if="uiState.active_tab === 'designer'"
          nodes-from="workflowState.definition.nodes"
          edges-from="workflowState.definition.edges"
          :options="{
            snapToGridFrom: uiState.snap_to_grid,
            showMiniMapFrom: uiState.show_minimap,
            showControlsFrom: uiState.show_controls,
            defaultZoomFrom: uiState.zoom,
          }"
          @onNodeSelect="canvasActions.select_node"
          @onEdgeSelect="canvasActions.select_edge"
          @onNodeMove="canvasActions.update_node_position"
          @onConnect="canvasActions.connect"
          @onDelete="canvasActions.delete_selection"
        >
          <template #emptyCanvas>
            <EmptyCanvasCta
              v-if="workflowState.definition.nodes.length === 0"
              :title="t('ui.workflows.editor.v1.canvas.emptyCanvas.title')"
              :actions="[
                { label: 'ManualTrigger', action: () => canvasActions.add_node({ type: 'ManualTrigger' }) },
                { label: 'LeadAddedTrigger', action: () => canvasActions.add_node({ type: 'LeadAddedTrigger' }) },
                { label: 'InboundReplyTrigger', action: () => canvasActions.add_node({ type: 'InboundReplyTrigger' }) },
              ]"
            />
          </template>
          <template #decorators>
            <ValidationOverlay
              :errors="validationState.errors"
              :warnings="validationState.warnings"
            />
          </template>
        </FlowCanvas>
        <RunPanel
          v-if="uiState.active_tab === 'runs'"
          visible-when="always"
          :sections="[
            { type: 'RunInput', input: runState.input },
            { type: 'RunOutput', output: runState.output },
            { type: 'RunLogsLink', workflowId: workflowId, runId: runState.last_run_id },
          ]"
        />
        <SettingsPanel
          v-if="uiState.active_tab === 'settings'"
          v-model:name="workflowState.name"
          v-model:description="workflowState.description"
          v-model:status="workflowState.status"
        />
      </template>

      <!-- Palette Panel -->
      <template #palette>
        <NodePalette
          v-if="uiState.active_tab === 'designer'"
          v-model:search="uiState.search_palette"
          :groups="paletteGroups"
          @drop-node="canvasActions.add_node"
        />
      </template>
    </WorkflowPanel>

    <!-- Footer -->
    <StickyStatusBar
      :left="[
        { component: 'Toggle', props: { label: 'Snap', modelValue: uiState.snap_to_grid, 'onUpdate:modelValue': (val: boolean) => uiState.snap_to_grid = val } },
        { component: 'Toggle', props: { label: 'MiniMap', modelValue: uiState.show_minimap, 'onUpdate:modelValue': (val: boolean) => uiState.show_minimap = val } },
        { component: 'Toggle', props: { label: 'Controls', modelValue: uiState.show_controls, 'onUpdate:modelValue': (val: boolean) => uiState.show_controls = val } },
      ]"
      :right="[
        { component: 'UChip', props: { text: selectionLabel } },
        { component: 'UChip', props: { text: runStatus } },
      ]"
    />

    <!-- Modals -->
    <UModal v-model:open="isImportModalOpen" :title="t('common.import_json')">
      <template #body>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t('common.import_json') }}</h3>
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
              color="primary"
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

<style>
body {
  overflow: hidden; /* Prevent scrolling on the body when using a fixed layout */
}
</style>
