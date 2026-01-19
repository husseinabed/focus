
import type { FlowNode, NodeSchema, NodePort, StringI18n } from '~~/app/types/workflow_editor'
import { type Connection, useVueFlow } from '@vue-flow/core'

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
  connection: Connection,
  nodes: FlowNode[]
): boolean {
  const sourceNode = nodes.find(n => n.id === connection.source)
  const targetNode = nodes.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) {
    return false
  }

  const sourcePort = sourceNode.data.schema?.ports.outputs.find(
    p => p.id === connection.sourceHandle
  )
  const targetPort = targetNode.data.schema?.ports.inputs.find(
    p => p.id === connection.targetHandle
  )

  if (!sourcePort || !targetPort) {
    return false
  }

  if (sourcePort.dataType === 'any' || targetPort.dataType === 'any') {
    return true
  }

  if (sourcePort.dataType === 'flow' || targetPort.dataType === 'flow') {
    return sourcePort.dataType === targetPort.dataType
  }

  return sourcePort.dataType === targetPort.dataType
}

export function createNodeRegistry(schemas: NodeSchema[]): Map<string, NodeSchema> {
  const registry = new Map<string, NodeSchema>()
  for (const schema of schemas) {
    registry.set(schema.type, schema)
  }
  return registry
}

export function getTranslation(key: StringI18n, locale: string, fallbackLocale: string = 'en'): string {
  if (!key) {
    return ''
  }
  return key[locale] || key[fallbackLocale] || ''
}

