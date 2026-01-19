import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { resolveWorkspaceId } from '~~/server/utils/workspace';

export default defineEventHandler(async (event) => {
  const cookieHeader = getHeader(event, 'cookie');
  console.log('API (Workflow) - Raw Cookie Header:', cookieHeader);

  let user: any = await serverSupabaseUser(event);
  let client = await serverSupabaseClient(event);

  // Fallback: If serverSupabaseUser fails to get the user (e.g., during SSR without proper cookie propagation),
  // try to manually extract the token and create a client.
  if (!user && cookieHeader) {
    console.log('API (Workflow) - Entering manual token extraction fallback.');
    const cookies = parse(cookieHeader);
    const supabaseAccessToken = cookies['sb-nlfaxqnsgogwvuyxvfgt-auth-token']; // Use the correct cookie name
    console.log('API (Workflow) - Manual Extracted Supabase Access Token:', supabaseAccessToken ? 'Present' : 'Missing');

    if (supabaseAccessToken) {
      // Replace with your actual Supabase URL and Anon Key from .env
      const SUPABASE_URL = process.env.SUPABASE_URL || '';
      const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
      console.log('API (Workflow) - SUPABASE_URL:', SUPABASE_URL ? 'Configured' : 'Missing');
      console.log('API (Workflow) - SUPABASE_KEY:', SUPABASE_KEY ? 'Configured' : 'Missing');

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Supabase URL or Key not configured.',
        });
      }

      client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          headers: { Authorization: `Bearer ${supabaseAccessToken}` },
        },
        auth: {
          persistSession: false, // Important for server-side stateless operation
        },
      });

      // Attempt to get user with the new client and token
      const { data: { user: manuallyFetchedUser } } = await client.auth.getUser();
      user = manuallyFetchedUser as any;
      console.log('API (Workflow) - Manually Fetched User:', user ? 'Authenticated' : 'Unauthenticated');
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  // The resolveWorkspaceId function now handles the UserLike type
  const workspaceId = await resolveWorkspaceId(client, user);

  const { page = 1, pageSize = 10, is_active, trigger_type, search } = getQuery(event);
  const offset = (Number(page) - 1) * Number(pageSize);

  let query = client
    .from('workflows')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  if (trigger_type) {
    query = query.eq('trigger_type', trigger_type);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error, count } = await query
    .range(offset, offset + Number(pageSize) - 1);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return {
    data,
    count,
    page: Number(page),
    pageSize: Number(pageSize),
  };
});
