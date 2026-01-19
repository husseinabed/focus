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
  const { graph, schema_version } = body;

  if (!graph || schema_version === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Graph and schema_version are required.',
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

  // Get the latest version number for this workflow
  const { data: latestVersion, error: latestVersionError } = await client
    .from('workflow_versions')
    .select('version')
    .eq('workflow_id', workflowId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (latestVersionError && latestVersionError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw createError({
      statusCode: 500,
      statusMessage: latestVersionError.message,
    });
  }

  const newVersionNumber = (latestVersion?.version || 0) + 1;

  // Insert new workflow version
  const { data: newWorkflowVersion, error: insertError } = await client
    .from('workflow_versions')
    .insert({
      workflow_id: workflowId,
      version: newVersionNumber,
      graph,
      schema_version,
      published: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError.message,
    });
  }

  return newWorkflowVersion;
});
