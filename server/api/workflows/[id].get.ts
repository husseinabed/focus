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

  const { data: workflow, error } = await client
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!workflow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Workflow not found or not accessible.',
    });
  }

  return workflow;
});
