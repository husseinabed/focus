import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client: SupabaseClient<Database> = await serverSupabaseClient(event);
  const { q, type, status, date_range, page = 1, pageSize = 10 } = getQuery(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  if (!user.app_metadata || !user.app_metadata.workspace_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    });
  }

  const workspaceId = user.app_metadata.workspace_id as string;

  // @ts-ignore
  let query = client
    .from('meetings')
    .select('*, leads(name, company), workflow_runs(id)')
    .eq('workspace_id', workspaceId);

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,leads.name.ilike.%${q}%,leads.company.ilike.%${q}%`);
  }

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (date_range) {
    const [start, end] = (date_range as string).split(',');
    if (start) {
      query = query.gte('start_time', start);
    }
    if (end) {
      query = query.lte('end_time', end);
    }
  }

  const { data, error, count } = await query
    .order('start_time', { ascending: false })
    .range((Number(page) - 1) * Number(pageSize), Number(page) * Number(pageSize) - 1)
    .limit(Number(pageSize));

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { meetings: data, total: count };
});
