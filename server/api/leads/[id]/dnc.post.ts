import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/supabase.d';
import { z } from 'zod';

const DncSchema = z.object({
  dnc_status: z.boolean(),
  dnc_reason: z.string().nullable().optional(),
});

const handleError = (error: Error | { message: string; statusCode?: number }) => {
  throw createError({
    statusCode: (error as { statusCode?: number }).statusCode || 500,
    statusMessage: error.message,
  });
};

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const leadId = event.context.params?.id;

  if (!leadId) {
    handleError({ statusCode: 400, message: 'Lead ID is required' });
  }

  const body = await readBody(event);
  const parsedBody = DncSchema.safeParse(body);

  if (!parsedBody.success) {
    handleError({ statusCode: 400, message: parsedBody.error.message });
  }

  try {
    const { data, error } = await client
      .from('leads')
      .update(parsedBody.data)
      .eq('id', leadId!)
      .select()
      .single();

    if (error) {
      handleError(error);
    }

    return data;
  } catch (error: any) {
    handleError(error);
  }
});
