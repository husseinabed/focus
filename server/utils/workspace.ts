import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createError } from 'h3';

interface UserLike extends User {
  sub?: string;
}

export const resolveWorkspaceId = async (
  client: SupabaseClient,
  user: UserLike
): Promise<string> => {
  const normalizedUserId = (user.id || user.sub)?.trim();
  const isValidUserId =
    !!normalizedUserId &&
    normalizedUserId !== 'undefined' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalizedUserId
    );

  if (!isValidUserId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const { data, error } = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', normalizedUserId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  if (!data?.workspace_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Missing workspace membership',
    });
  }

  return data.workspace_id;
};
