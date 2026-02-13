import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/supabase.d';
import { z } from 'zod';

const MessageSendSchema = z.object({
  conversation_id: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content cannot be empty'),
  sender_type: z.enum(['agent', 'lead']), // 'agent' for outbound messages
  status: z.enum(['sent', 'scheduled', 'needs_approval']).default('sent'),
  scheduled_at: z.string().datetime().nullable().optional(), // For scheduled messages
});

const handleError = (error: Error | { message: string; statusCode?: number }) => {
  throw createError({
    statusCode: (error as { statusCode?: number }).statusCode || 500,
    statusMessage: error.message,
  });
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody(event);

  const parsedBody = MessageSendSchema.safeParse(body);

  if (!parsedBody.success) {
    handleError({ statusCode: 400, message: parsedBody.error.message });
  }

  const { conversation_id, content, sender_type, status, scheduled_at } = parsedBody.data;

  // For 'agent' sender_type, ensure agent_id is provided
  // In a real app, you'd get the current user's ID from the session
  const agent_id = event.context.user?.id || 'placeholder-agent-id'; // TODO: Replace with actual agent ID from auth

  try {
    const { data: newMessage, error } = await client
      .from('messages')
      .insert({
        conversation_id,
        content,
        sender_type,
        status,
        agent_id: sender_type === 'agent' ? agent_id : null,
        // lead_id: sender_type === 'lead' ? leadId : null, // Assuming lead_id can be inferred from conversation_id
        scheduled_at,
      })
      .select()
      .single();

    if (error) {
      handleError(error);
    }

    // Optionally, update the conversation's last_message_at and last_message_preview
    await client
      .from('conversations')
      .update({
        last_message_at: newMessage!.created_at,
        last_message_preview: newMessage!.content,
        // If message is sent by agent, and conversation status is 'needs_approval', change it to 'replied'
        status: status === 'sent' ? 'replied' : status, // Update status based on message action
        // reset unread count if message is sent by agent
        unread_count: sender_type === 'agent' ? 0 : undefined,
      })
      .eq('id', conversation_id);

    return newMessage;
  } catch (error: any) {
    handleError(error);
  }
});
