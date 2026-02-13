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

  const { data, error } = await client
    .from('content_templates')
    .select('*')
    .eq('id', templateId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // No rows found
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found: Template not found',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  // Set content type for JSON download
  event.node.res.setHeader('Content-Type', 'application/json');
  event.node.res.setHeader('Content-Disposition', `attachment; filename="template-${templateId}.json"`);

  return data;
});
