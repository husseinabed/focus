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

  const { data: workflowRuns, error: runsError } = await client
    .from('workflow_runs')
    .select('id, status, started_at, finished_at, workflow_versions(id, version, published, schema_version, created_at)')
    .eq('workflow_id', workflowId)
    .eq('workspace_id', workspaceId) // RLS for workflow runs
    .order('started_at', { ascending: false });

  if (runsError) {
    throw createError({
      statusCode: 500,
      statusMessage: runsError.message,
    });
  }

  return workflowRuns;
});
