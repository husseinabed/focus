import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/supabase.d';
import { z } from 'zod';

const ConversationQuerySchema = z.object({
  q: z.string().optional().default(''),
  status: z.enum(['all', 'open', 'waiting', 'snoozed', 'closed', 'needs_approval', 'replied']).optional().default('all'),
  channel: z.enum(['all', 'whatsapp', 'email', 'sms']).optional().default('all'),
  // Temporarily disable intent filter as it's not fully supported by the current data model.
  // intent: z.enum(['all', 'sales', 'support', 'marketing', 'other']).optional().default('all'),
  unreadOnly: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).optional().default(false),
  sortBy: z.enum(['recent', 'priority']).optional().default('recent'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional().nullable(), // For pagination
  pageSize: z.preprocess((val) => parseInt(String(val)), z.number().int().positive()).optional().default(10),
});

const handleError = (error: Error | { message: string; statusCode?: number }) => {
  throw createError({
    statusCode: (error as { statusCode?: number }).statusCode || 500,
    statusMessage: error.message,
  });
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const query = getQuery(event);

  const parsedQuery = ConversationQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    handleError({ statusCode: 400, message: parsedQuery.error.message });
  }

  const { q, status, channel, unreadOnly, sortBy, sortDirection, cursor, pageSize } = parsedQuery.data;

  try {
    let dbQuery = client
      .from('conversations')
      .select('*, leads(*)') // Fetch related lead data
      .order('last_message_at', { ascending: sortDirection === 'asc' });

    if (q) {
      dbQuery = dbQuery.or(`last_message_preview.ilike.%${q}%, leads.company_name.ilike.%${q}%, leads.full_name.ilike.%${q}%, leads.phone.ilike.%${q}%`);
    }

    if (status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }

    if (channel !== 'all') {
      dbQuery = dbQuery.eq('channel', channel);
    }

    if (unreadOnly) {
      dbQuery = dbQuery.gt('unread_count', 0);
    }

    // Implement cursor-based pagination
    if (cursor) {
      // For 'recent' sorting, cursor would be `last_message_at`
      // For 'priority' sorting, cursor would be a combination of priority and last_message_at
      // This needs more sophisticated logic depending on how cursor is generated.
      // For simplicity, let's assume cursor is based on `last_message_at` for now.
      if (sortBy === 'recent' && sortDirection === 'desc') {
        dbQuery = dbQuery.lt('last_message_at', cursor);
      } else if (sortBy === 'recent' && sortDirection === 'asc') {
        dbQuery = dbQuery.gt('last_message_at', cursor);
      }
      // Priority based cursor pagination would be more complex and usually involves combining two fields
      // For now, it's not fully implemented here.
    }

    dbQuery = dbQuery.limit(pageSize);

    const { data: conversations, error } = await dbQuery;

    if (error) {
      handleError(error);
    }

    let nextCursor: string | null = null;
    if (conversations && conversations.length === pageSize) {
      // Determine next cursor based on the last item's sort field
      if (sortBy === 'recent') {
        nextCursor = conversations[conversations.length - 1].last_message_at;
      }
      // For priority, it would be more complex
    }

    return { items: conversations, nextCursor };
  } catch (error: any) {
    handleError(error);
  }
});
