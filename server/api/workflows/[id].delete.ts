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

  // First, check if the workflow exists and belongs to the workspace
  const { data: existingWorkflow, error: fetchError } = await client
    .from('workflows')
    .select('id')
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .single();

  if (fetchError) {
    throw createError({
      statusCode: 500,
      statusMessage: fetchError.message,
    });
  }

  if (!existingWorkflow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workflow not found or not accessible for deletion.',
    });
  }

  // Perform the deletion. Supabase RLS should handle cascading deletes if configured, or it needs to be handled explicitly
  const { error: deleteError } = await client
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId);

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: deleteError.message,
    });
  }

  return { message: 'Workflow deleted successfully.' };
});
