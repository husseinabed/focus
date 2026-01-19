<!-- components/workflows/FlowCanvas.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { VueFlow, useVueFlow, type Connection, type NodeMouseEvent, type EdgeMouseEvent, type NodeChange, type EdgeChange } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'

// 1. Import all node schemas
import {  list } from '~~/shared/workflowNodeSchemas'



// 2. Import all node components
import Manual from '~/components/workflow/node/trigger/Manual.vue'
import LeadAdded from '~/components/workflow/node/trigger/LeadAdded.vue'
import Scheduled from '~/components/workflow/node/trigger/Scheduled.vue'
import InboundReply from '~/components/workflow/node/trigger/InboundReply.vue'


import Log from '~/components/workflow/node/action/Log.vue'
import Done from '~/components/workflow/node/action/Done.vue'
import Decision from '~/components/workflow/node/action/Decision.vue'
import Delay from '~/components/workflow/node/action/Delay.vue'
import SendEmail from '~/components/workflow/node/action/SendEmail.vue'

// import default controls styles
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'
import '@vue-flow/controls/dist/style.css'



type ValidationItem = { id?: string; message: string; node_id?: string; edge_id?: string; severity?: 'error' | 'warning' }

type FlowCanvasOptions = {
  snapToGrid?: boolean
  showMiniMap?: boolean
  showControls?: boolean
  defaultZoom?: number
  fitViewOnInit?: boolean
  zoomOnScroll?: boolean
  panOnDrag?: boolean
  // future
  // grid?: [number, number]
}

const props = withDefaults(
  defineProps<{
    nodes: any[] // ideally: Node[]
    edges: any[] // ideally: Edge[]
    options?: FlowCanvasOptions
    validation?: {
      errors?: ValidationItem[]
      warnings?: ValidationItem[]
    }
    empty?: boolean
  }>(),
  {
    options: () => ({
      snapToGrid: true,
      showMiniMap: true,
      showControls: true,
      defaultZoom: 1,
      fitViewOnInit: true,
      zoomOnScroll: true,
      panOnDrag: true
    }),
    validation: () => ({ errors: [], warnings: [] }),
    empty: false
  }
)

const emit = defineEmits<{
  (e: 'nodeSelect', payload: { node_id: string }): void
  (e: 'edgeSelect', payload: { edge_id: string }): void
  (e: 'nodeMove', payload: { node_id: string; position: { x: number; y: number } }): void
  (e: 'connect', payload: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }): void
  (e: 'delete', payload: { nodes: string[]; edges: string[] }): void
  (e: 'nodeDrop', payload: { type: string; position: { x: number; y: number } }): void
}>()

const hasIssues = computed(() => {
  const errs = props.validation?.errors?.length ?? 0
  const warns = props.validation?.warnings?.length ?? 0
  return errs + warns > 0
})

/**
 * If using Vue Flow, wire these up:
*/
const { project } = useVueFlow()


// Optional: if you want to emit move updates (mock)
function handleNodeMove(node: { id: string; position: { x: number; y: number } }) {
  emit('nodeMove', { node_id: node.id, position: node.position })
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const nodeType = event.dataTransfer?.getData('application/vueflow')
  if (!nodeType) return

  const target = event.currentTarget as HTMLElement
  const bounds = target.getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  emit('nodeDrop', { type: nodeType, position })
}

function handleNodesChange(changes: NodeChange[]) {
  const removed = changes.filter((change) => change.type === 'remove')
  if (removed.length > 0) {
    emit('delete', { nodes: removed.map((change) => change.id), edges: [] })
  }
}

function handleEdgesChange(changes: EdgeChange[]) {
  const removed = changes.filter((change) => change.type === 'remove')
  if (removed.length > 0) {
    emit('delete', { nodes: [], edges: removed.map((change) => change.id) })
  }
}
 

// 2. Define a node component map
const componentsMap: Record<string, any> = {
  Manual,
  LeadAdded,
  InboundReply,
  Scheduled,
  ActionLog: Log,
  ActionDone: Done,
  ActionDecision: Decision,
  ActionDelay: Delay,
  ActionSendEmail: SendEmail
}



const nodeComponentMap: Record<string, any> = {}

list.forEach(schema => {
  nodeComponentMap[schema.type] = schema.component
})
</script>

<template>
  <div class="flow-canvas" @dragover="handleDragOver" @drop="handleDrop">
    <!-- ✅ Empty Canvas Slot -->
    <div v-if="empty || (nodes?.length ?? 0) === 0" class="absolute inset-0">
      <slot name="emptyCanvas" />
    </div>

    <!-- ✅ Decorators -->
    <div class="decorators pointer-events-none">
      <div v-if="hasIssues" class="validation-overlay pointer-events-auto">
        <div v-if="(validation?.errors?.length ?? 0) > 0" class="space-y-1">
          <div
            v-for="(error, idx) in validation?.errors"
            :key="error.id ?? `err-${idx}`"
            class="msg msg-error"
          >
            {{ error.message }}
          </div>
        </div>

        <div v-if="(validation?.warnings?.length ?? 0) > 0" class="mt-2 space-y-1">
          <div
            v-for="(warning, idx) in validation?.warnings"
            :key="warning.id ?? `warn-${idx}`"
            class="msg msg-warn"
          >
            {{ warning.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ REAL Vue Flow (uncomment when ready) -->

    <ClientOnly>
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :zoom-on-scroll="options.zoomOnScroll"
        :pan-on-drag="options.panOnDrag"
        :fit-view-on-init="options.fitViewOnInit"
        :snap-to-grid="options.snapToGrid"
        :default-zoom="options.defaultZoom"
        @node-click="(e: NodeMouseEvent) => emit('nodeSelect', { node_id: e.node.id })"
        @edge-click="(e: EdgeMouseEvent) => emit('edgeSelect', { edge_id: e.edge.id })"
        @node-drag-stop="(e: NodeMouseEvent) => handleNodeMove(e.node)"
        @connect="(c: Connection) => emit('connect', { source: c.source!, target: c.target!, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle })"
        @nodes-change="handleNodesChange"
        @edges-change="handleEdgesChange"
      >
        <Background />
        <MiniMap v-if="options.showMiniMap" />
        <Controls v-if="options.showControls" />
        <template v-for="(component, name) in nodeComponentMap" :key="name" #["node-"+name]="nodeProps">
          <component :is="componentsMap[component]" v-bind="nodeProps" :node="nodeProps" />
        </template>
      </VueFlow>
      <template #fallback>
        <div class="h-full w-full" />
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.flow-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgb(248 250 252);
}

/* overlay */
.validation-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  max-width: 420px;
  border: 1px solid rgb(226 232 240);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  padding: 10px;
  border-radius: 12px;
  z-index: 50;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
}
.msg {
  font-size: 12px;
  line-height: 1.3;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.msg-error {
  color: rgb(153 27 27);
  background: rgb(254 242 242);
  border-color: rgb(254 202 202);
}
.msg-warn {
  color: rgb(146 64 14);
  background: rgb(255 251 235);
  border-color: rgb(254 215 170);
}
</style>
