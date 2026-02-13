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

  const { q, category, language, active, channel, status } = getQuery(event);

  let query = client
    .from('content_templates')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (q) {
    query = query.or(`title.ilike.%${q}%,key.ilike.%${q}%`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (channel && channel !== 'all') {
    query = query.eq('channel', channel);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else if (active && active !== 'all') {
    if (active === 'active') {
      query = query.eq('status', 'active');
    } else {
      query = query.in('status', ['draft', 'archived']);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const rows = data || [];
  const normalizedLanguage = typeof language === 'string' ? language : undefined;
  const filteredRows =
    normalizedLanguage && normalizedLanguage !== 'all'
      ? rows.filter((row: any) => row?.locales && normalizedLanguage in row.locales)
      : rows;

  return filteredRows;
});
