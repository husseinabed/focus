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
  const versionId = getRouterParam(event, 'versionId');

  if (!workflowId || !versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Workflow ID and Version ID are required.',
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
    .eq('id', versionId)
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

  // Unpublish all other versions of this workflow
  const { error: unpublishError } = await client
    .from('workflow_versions')
    .update({ published: false })
    .eq('workflow_id', workflowId)
    .neq('id', versionId);

  if (unpublishError) {
    throw createError({
      statusCode: 500,
      statusMessage: unpublishError.message,
    });
  }

  // Publish the specified version
  const { data: publishedVersion, error: publishError } = await client
    .from('workflow_versions')
    .update({ published: true })
    .eq('id', versionId)
    .eq('workflow_id', workflowId)
    .select()
    .single();

  if (publishError) {
    throw createError({
      statusCode: 500,
      statusMessage: publishError.message,
    });
  }

  return publishedVersion;
});
