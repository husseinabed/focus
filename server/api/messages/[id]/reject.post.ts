
import { useSupabaseServer } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const client = useSupabaseServer();
  const id = event.context.params?.id;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Message ID is required",
    });
  }

  // Basic permission check
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const rejection_reason = body.rejection_reason || null;

  const { data, error } = await client
    .from("messages")
    .update({
      status: "draft",
      approval_status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: rejection_reason,
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
