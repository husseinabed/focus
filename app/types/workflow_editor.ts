 

export type NodeCategory = 'trigger' | 'logic' | 'messaging' | 'action'

export interface CatalogItem {
  type: string
  category: NodeCategory
  title: string
  icon: string
  hint?: string
}

export interface NodePort {
  id: string
  label?: string
  dataType: 'flow' | 'string' | 'number' | 'boolean' | 'object' | 'any'
  required?: boolean
}

export interface NodeSchema extends CatalogItem {
  ports: {
    inputs: NodePort[]
    outputs: NodePort[]
  }
  ui: {
    renderer: string // e.g. 'trigger', 'base'
    tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    width?: number
  }
  execution: {
    requiresApproval?: boolean
    blocking?: boolean
  }
  defaultData?: Record<string, any>
}

// Represents an instance of a node in the flow
export interface FlowNode {
  id: string
  type: string // references NodeSchema.type
  position: { x: number; y: number }
  data: {
    // Structure requested: schema, label, notes, execution
    schema?: NodeSchema // The full schema snapshot (optional but requested structure)
    label?: string
    notes?: string
    execution?: Record<string, any>
    runtime?: {
      status?: 'idle' | 'running' | 'success' | 'fail'
      lastEvent?: any
      error?: string
      startedAt?: string
      finishedAt?: string
    }
    [key: string]: any // Allow other data properties
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

// Helpers

export function createNodeRegistry(schemas: NodeSchema[]): Map<string, NodeSchema> {
  const registry = new Map<string, NodeSchema>()
  for (const schema of schemas) {
    registry.set(schema.type, schema)
  }
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
      label: schema.title.en,
      schema: schema,
      notes: '',
      execution: {},
      ...schema.defaultData
    }
  }
}

export function canConnect(
  sourceHandle: { dataType: string },
  targetHandle: { dataType: string }
): boolean {
  if (!sourceHandle || !targetHandle) return false
  
  const source = sourceHandle.dataType
  const target = targetHandle.dataType

  if (source === 'any' || target === 'any') return true
  // Flow connections are special, usually only flow-to-flow
  if (source === 'flow' || target === 'flow') {
    return source === target
  }
  return source === target
}
