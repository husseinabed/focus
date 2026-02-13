import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { createError } from 'h3';
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

  const workspaceId = user.app_metadata?.workspace_id || await resolveWorkspaceId(client, user);

  const templateId = event.context.params?.id;
  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Missing template ID',
    });
  }

  const { error, count } = await client
    .from('content_templates')
    .delete()
    .eq('id', templateId)
    .eq('workspace_id', workspaceId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (count === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found: Template not found or not owned by user',
    });
  }

  return { status: 'success', message: 'Template deleted successfully' };
});
