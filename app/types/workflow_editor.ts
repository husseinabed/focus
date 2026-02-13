export type NodeCategory = 'trigger' | 'logic' | 'messaging' | 'action'

export interface CatalogItem {
  type: string
  category: NodeCategory
  title: string // i18n key
  icon: string
  hint?: string // i18n key
}

export interface NodePort {
  id: string
  label?: string // i18n key
  dataType: 'flow' | 'string' | 'number' | 'boolean' | 'object' | 'any'
  required?: boolean
}

export interface NodeSchema extends CatalogItem {
  ports: {
    inputs: NodePort[]
    outputs: NodePort[]
  }

  // Inspector / config schema (optional)
  config?: Record<
    string,
    | {
        type: 'string'
        label: string
        description?: string
        placeholder?: string
        enum?: string[]
        default?: string
        format?: 'text' | 'textarea'
        required?: boolean
      }
    | {
        type: 'boolean'
        label: string
        description?: string
        default?: boolean
      }
  >

  ui: {
    renderer: string // e.g. 'trigger', 'actions', 'base'
    tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    width?: number
  }

  execution: {
    requiresApproval?: boolean
    blocking?: boolean
    sideEffect?: boolean
  }

  defaultData?: Record<string, any>
}

// ----------------------------
// Flow graph runtime
// ----------------------------

export interface FlowNode {
  id: string
  type: string // references NodeSchema.type
  position: { x: number; y: number }
  data: {
    schema?: NodeSchema
    label?: string // i18n key
    notes?: string
    execution?: Record<string, any>
    runtime?: {
      status?: 'idle' | 'running' | 'success' | 'fail'
      lastEvent?: any
      error?: string
      startedAt?: string
      finishedAt?: string
    }
    [key: string]: any
  }
}

export interface FlowEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  type?: string
  animated?: boolean
  label?: string
}

// ----------------------------
// Helpers
// ----------------------------

export function createNodeRegistry(schemas: NodeSchema[]): Map<string, NodeSchema> {
  const registry = new Map<string, NodeSchema>()
  for (const schema of schemas) registry.set(schema.type, schema)
  return registry
}

export function createFlowNodeFromSchema(
  schema: NodeSchema,
  position: { x: number; y: number } = { x: 0, y: 0 }
): FlowNode {
  return {
    id: crypto.randomUUID(),
    type: schema.type,
    position,
    data: {
      label: schema.title, // resolved via $t() in UI
      schema,
      notes: '',
      execution: {},
      ...schema.defaultData,
    },
  }
}

export function canConnect(
  sourceHandle: { dataType: string },
  targetHandle: { dataType: string }
): boolean {
  if (!sourceHandle || !targetHandle) return false

  if (sourceHandle.dataType === 'any' || targetHandle.dataType === 'any') return true
  if (sourceHandle.dataType === 'flow' || targetHandle.dataType === 'flow') {
    return sourceHandle.dataType === targetHandle.dataType
  }
  return sourceHandle.dataType === targetHandle.dataType
}
