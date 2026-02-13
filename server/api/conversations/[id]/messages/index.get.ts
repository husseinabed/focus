import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/supabase.d';

const handleError = (error: Error | { message: string; statusCode?: number }) => {
  throw createError({
    statusCode: (error as { statusCode?: number }).statusCode || 500,
    statusMessage: error.message,
  });
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const conversationId = event.context.params?.id;

  if (!conversationId) {
    handleError({ statusCode: 400, message: 'Conversation ID is required' });
  }

  try {
    const { data: messages, error } = await client
      .from('messages')
      .select('*') // Select all fields from messages
      .eq('conversation_id', conversationId!)
      .order('created_at', { ascending: true }); // Order by creation time

    if (error) {
      handleError(error);
    }

    return messages;
  } catch (error: any) {
    handleError(error);
  }
});