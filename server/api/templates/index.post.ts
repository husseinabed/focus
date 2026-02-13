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

  const body = await readBody(event);

  // Basic validation
  if (!body.title || !body.category || !body.channel || !body.status || !body.locales) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Bad Request: Missing required template fields (title, category, channel, status, locales)',
    });
  }

  const key = body.key || `${body.title}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  const { data, error } = await client
    .from('content_templates')
    .insert({
      workspace_id: workspaceId,
      key,
      title: body.title,
      category: body.category,
      channel: body.channel,
      status: body.status,
      locales: body.locales,
      variants: body.variants || {},
      variables_schema: body.variables_schema || {},
      defaults: body.defaults || {},
      rules: body.rules || {},
      compliance: body.compliance || {},
      tags: body.tags || [],
    })
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data[0];
});
