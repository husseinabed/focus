
import { useSupabaseServer } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const client = useSupabaseServer();
  const id = event.context.params?.id; // Safely access id

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Message ID is required",
    });
  }

  // Basic permission check (replace with actual RLS/policy checks)
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const { data, error } = await client
    .from("messages")
    .update({
      status: "approved",
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", id)
    .select();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data[0];
});
