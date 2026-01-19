import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import { createError, readBody } from 'h3';
import type { Database, TablesInsert } from '~/types/supabase.d';
import type { SupabaseClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const client = await (serverSupabaseClient(event) as Promise<SupabaseClient<Database>>);
  const body = await readBody(event);

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
  const createdBy = user.id;

  // Validate required fields
  const { lead_id, type, provider, title, start_time, end_time, timezone } = body;
  if (!lead_id || !type || !provider || !title || !start_time || !end_time || !timezone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required meeting fields',
    });
  }

  const meetingData: TablesInsert<'meetings'> = {
    workspace_id: workspaceId,
    created_by: createdBy,
    lead_id: body.lead_id,
    type: body.type,
    provider: body.provider,
    title: body.title,
    description: body.description,
    start_time: body.start_time,
    end_time: body.end_time,
    timezone: body.timezone,
    meeting_url: body.meeting_url,
    workflow_run_id: body.workflow_run_id,
    status: body.status || 'scheduled',
  };

  const { data, error } = await client
    .from('meetings')
    // @ts-ignore
    .insert(meetingData)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data[0];
});
