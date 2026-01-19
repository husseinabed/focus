import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client: SupabaseClient<Database> = await serverSupabaseClient(event);
  const meetingId = getRouterParam(event, 'id');

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

  if (!meetingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Meeting ID is required',
    });
  }

  const workspaceId = user.app_metadata.workspace_id as string;

  const { error } = await client
    .from('meetings')
    .delete()
    .eq('id', meetingId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('Error deleting meeting:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { status: 'Meeting deleted successfully' };
});
