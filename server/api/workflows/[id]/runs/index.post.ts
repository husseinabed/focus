import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { resolveWorkspaceId } from '~~/server/utils/workspace';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const workspaceId = await resolveWorkspaceId(client, user);

  const workflowId = getRouterParam(event, 'id');

  if (!workflowId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workflow ID is required.',
    });
  }

  const body = await readBody(event);
  const { workflow_version_id, lead_id } = body;

  if (!workflow_version_id || !lead_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'workflow_version_id and lead_id are required.',
    });
  }

  // Verify the workflow exists and belongs to the user's workspace
  const { data: workflow, error: workflowError } = await client
    .from('workflows')
    .select('id')
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .single();

  if (workflowError) {
    throw createError({
      statusCode: 500,
      statusMessage: workflowError.message,
    });
  }

  if (!workflow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workflow not found or not accessible.',
    });
  }

  // Verify the workflow version exists and belongs to the workflow
  const { data: workflowVersion, error: versionError } = await client
    .from('workflow_versions')
    .select('id')
    .eq('id', workflow_version_id)
    .eq('workflow_id', workflowId)
    .single();

  if (versionError) {
    throw createError({
      statusCode: 500,
      statusMessage: versionError.message,
    });
  }

  if (!workflowVersion) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workflow version not found or not accessible.',
    });
  }

  // Verify the lead exists and belongs to the user's workspace
  const { data: lead, error: leadError } = await client
    .from('leads')
    .select('id')
    .eq('id', lead_id)
    .eq('workspace_id', workspaceId)
    .single();

  if (leadError) {
    throw createError({
      statusCode: 500,
      statusMessage: leadError.message,
    });
  }

  if (!lead) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lead not found or not accessible.',
    });
  }

  const { data: workflowRun, error: runError } = await client
    .from('workflow_runs')
    .insert({
      workspace_id: workspaceId,
      workflow_id: workflowId,
      workflow_version_id,
      lead_id,
      status: 'running', // Initial status
      started_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (runError) {
    throw createError({
      statusCode: 500,
      statusMessage: runError.message,
    });
  }

  return workflowRun;
});
