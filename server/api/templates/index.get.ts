import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';

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

  const { q, category, language, active } = getQuery(event);

  let query = client
    .from('templates')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (language && language !== 'all') {
    query = query.eq('language', language);
  }

  if (active && active !== 'all') {
    query = query.eq('is_active', active === 'active');
  }

  const { data, error } = await query;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
