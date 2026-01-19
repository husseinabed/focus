import { defineStore } from 'pinia';
import { ref } from 'vue';

interface WorkflowDefinition {
  version: number;
  nodes: any[]; // Define a more specific type if schema is available
  edges: any[]; // Define a more specific type if schema is available
}

interface WorkflowState {
  id: string | null;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  description: string;
  tags: string[];
  definition: WorkflowDefinition;
}

interface UiState {
  dirty: boolean;
  saving: boolean;
  running: boolean;
  active_tab: 'designer' | 'runs' | 'settings';
  inspector_open: boolean;
  palette_open: boolean;
  snap_to_grid: boolean;
  show_minimap: boolean;
  show_controls: boolean;
  zoom: number;
  selected_node_id: string | null;
  selected_edge_id: string | null;
  search_palette: string;
}

export const useWorkflowStore = defineStore('workflow', () => {
  const workflow = ref<WorkflowState>({
    id: null,
    name: '',
    status: 'draft',
    description: '',
    tags: [],
    definition: {
      version: 1,
      nodes: [],
      edges: [],
    },
  });

  const ui = ref<UiState>({
    dirty: false,
    saving: false,
    running: false,
    active_tab: 'designer',
    inspector_open: true,
    palette_open: true,
    snap_to_grid: true,
    show_minimap: true,
    show_controls: true,
    zoom: 1,
    selected_node_id: null,
    selected_edge_id: null,
    search_palette: '',
  });

  function updateWorkflow(newWorkflow: WorkflowState) {
    workflow.value = { ...newWorkflow };
  }

  function setActiveTab(tabId: UiState['active_tab']) {
    ui.value.active_tab = tabId;
  }

  return {
    workflow,
    ui,
    updateWorkflow,
    setActiveTab,
  };
});
