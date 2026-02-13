export type LocaleLabel = string

export type Port = {
  id: string
  dataType: 'flow' | 'string' | 'number' | 'boolean' | 'any' | 'json'
  label?: LocaleLabel
}

export type NodePorts = {
  inputs: Port[]
  outputs: Port[]
}

// ---- Field schema (config + outputs) ----

export type BaseField = {
  label: string
  description?: string
  required?: boolean
}

export type StringField = BaseField & {
  type: 'string'
  enum?: string[]
  default?: string
  format?: 'text' | 'textarea' | 'email' | 'url'
  placeholder?: string
}

export type BooleanField = BaseField & {
  type: 'boolean'
  default?: boolean
}

export type NumberField = BaseField & {
  type: 'number'
  default?: number
  min?: number
  max?: number
}

export type JsonField = BaseField & {
  type: 'json'
  // optional hint for UI/editors (free-form JSON)
  format?: 'json'
  default?: unknown
}

export type FieldSchema = StringField | BooleanField | NumberField | JsonField

export type ObjectSchema = {
  type: 'object'
  label?: string
  description?: string
  required?: string[]
  properties: Record<string, FieldSchema | ObjectSchema | ArraySchema>
}

export type ArraySchema = {
  type: 'array'
  label?: string
  description?: string
  required?: boolean
  items: FieldSchema | ObjectSchema
}

export type Schema = FieldSchema | ObjectSchema | ArraySchema

// ---- UI & execution ----

export type NodeUI = {
  renderer: string
  tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger'
  width?: number
}

export type NodeExecution = {
  blocking: boolean
  sideEffect?: boolean
}

// ---- Runtime execution types ----

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LoggingNodeConfig = {
  level: LogLevel
  message: string
  includeContext: boolean
}

export type NodeContext = {
  runId: string
  workflowId: string
  nodeId: string
  now: string // ISO
  locale?: string
  // add anything you already carry (lead, workspace, etc.)
  data?: Record<string, unknown>
}

export type ExecuteResult<TOutputs extends Record<string, unknown> = Record<string, unknown>> = {
  status: 'success' | 'failed'
  outputs: TOutputs
  error?: {
    code?: string
    message: string
    details?: unknown
  }
}

export type NodeExecuteFn<TConfig, TInputs extends Record<string, unknown>, TOutputs extends Record<string, unknown>> = (
  args: {
    config: TConfig
    inputs: TInputs
    ctx: NodeContext
  }
) => Promise<ExecuteResult<TOutputs>> | ExecuteResult<TOutputs>

// ---- Node schema ----

export type WorkflowNodeSchema<
  TType extends string = string,
  TConfigSchema extends ObjectSchema | undefined = ObjectSchema | undefined,
  TOutputSchema extends ObjectSchema | undefined = ObjectSchema | undefined,
  TExecute extends NodeExecuteFn<any, any, any> | undefined = NodeExecuteFn<any, any, any> | undefined
> = {
  type: TType
  category: string
  title: string
  component?: string
  icon?: string
  hint?: string

  ports: NodePorts

  // inspector config schema
  config?: TConfigSchema

  // explicit output schema (per output port payload)
  outputs?: TOutputSchema

  ui?: NodeUI
  execution?: NodeExecution

  // runtime executor
  execute?: TExecute
}

// ---- Logging node: output schema + execute ----

export type LoggingNodeOutputs = {
  out: {
    level: LogLevel
    message: string
    timestamp: string
    includedContext: boolean
  }
}