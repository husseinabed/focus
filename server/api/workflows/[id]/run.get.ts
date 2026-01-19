import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { createError, getQuery, getRouterParam, setResponseHeaders } from 'h3'
import { resolveWorkspaceId } from '~~/server/utils/workspace'
import { executeWorkflow } from '~~/server/utils/workflow/executor'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const workspaceId = await resolveWorkspaceId(client, user)
  const workflowId = getRouterParam(event, 'id')

  if (!workflowId) {
    throw createError({ statusCode: 400, statusMessage: 'Workflow ID is required.' })
  }

  // 1) Ensure workflow exists & is accessible (workspace isolation)
  const { data: workflow, error: wfErr } = await client
    .from('workflows')
    .select('id')
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .single()

  if (wfErr) {
    throw createError({ statusCode: 500, statusMessage: wfErr.message })
  }

  if (!workflow) {
    throw createError({ statusCode: 404, statusMessage: 'Workflow not found or not accessible.' })
  }

  // 2) Load latest workflow version graph
  const { data: version, error: vErr } = await client
    .from('workflow_versions')
    .select('id, graph, schema_version, created_at')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (vErr) {
    throw createError({ statusCode: 500, statusMessage: vErr.message })
  }

  if (!version?.graph) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No workflow version found to run.',
    })
  }

  const graph: any = version.graph
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : []
  const edges = Array.isArray(graph.edges) ? graph.edges : []

  if (nodes.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workflow version graph has no nodes.',
    })
  }

  // 3) Parse input
  const query = getQuery(event)
  let input: Record<string, any> = {}

  if (typeof query.input === 'string' && query.input.trim()) {
    try {
      input = JSON.parse(query.input)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input JSON.' })
    }
  }

  // 4) SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const res = event.node.res
  res.flushHeaders?.()

  const ac = new AbortController()

  const writeEvent = (name: string, payload?: any) => {
    if (res.writableEnded) return
    res.write(`event: ${name}\n`)
    if (payload !== undefined) res.write(`data: ${JSON.stringify(payload)}\n`)
    res.write('\n')
  }

  const heartbeat = setInterval(() => {
    writeEvent('ping', { ts: new Date().toISOString() })
  }, 15000)

  res.on('close', () => {
    clearInterval(heartbeat)
    ac.abort()
  })

  writeEvent('started', {
    workflowId,
    workflowVersionId: version.id,
    schemaVersion: version.schema_version,
    startedAt: new Date().toISOString(),
  })

  try {
    const result = await executeWorkflow(
      { nodes, edges },
      {
        input,
        onEvent: (runEvent) => writeEvent('node', runEvent),
        onLog: (logEvent) => writeEvent('log', logEvent),
        signal: ac.signal,
      }
    )

    writeEvent('finished', result)
  } catch (runError: any) {
    const message = runError?.message || 'Workflow run failed.'
    writeEvent('error', { message })
  } finally {
    clearInterval(heartbeat)
    res.end()
  }
})
