import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const workspaceId = user.app_metadata?.workspace_id;
  if (!workspaceId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Missing workspace ID or workspace_id in app_metadata',
    });
  }

  const body = await readBody(event);

  // Basic validation
  if (!body.name || !body.category || !body.language || !body.body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Missing required template fields (name, category, language, body)',
    });
  }

  const { data, error } = await client
    .from('templates')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      name: body.name,
      category: body.category,
      language: body.language,
      body: body.body,
      variables: body.variables || {},
      is_active: body.is_active !== undefined ? body.is_active : true,
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