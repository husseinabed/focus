import { serverSupabaseClient } from '#supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeadSchema } from '~/types/leads';
import type { Database } from '~/types/supabase.d';
import { z } from 'zod';

// Helper function for consistent error handling
const handleError = (error: Error | { message: string; statusCode?: number }) => {
  throw createError({
    statusCode: (error as { statusCode?: number }).statusCode || 500,
    statusMessage: error.message,
  });
};

export default defineEventHandler(async (event) => {
  const client: Awaited<ReturnType<typeof serverSupabaseClient<Database>>> = await serverSupabaseClient(event);
  const leadId = event.context.params?.id;

  if (!leadId) {
    handleError({ statusCode: 400, message: 'Lead ID is required' });
  }

  const body = await readBody(event);
  const parsedBody = LeadSchema.partial().safeParse(body);

  if (!parsedBody.success) {
    handleError({ statusCode: 400, message: parsedBody.error.message });
  }

  type LeadUpdatePayload = Database['public']['Tables']['leads']['Update'];
  const updateData: LeadUpdatePayload = parsedBody.data as LeadUpdatePayload; // Direct assignment after successful parsing

  if (Object.keys(updateData).length === 0) {
    // No valid fields to update, return a successful response with no content.
    return {};
  }

  try {
    const { data, error } = await client
      .from('leads')
      .update(updateData)
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
