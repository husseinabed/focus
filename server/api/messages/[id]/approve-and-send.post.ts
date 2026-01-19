
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

  // Basic permission check
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  // First, update the message status and approval status
  const { data: messageData, error: updateError } = await client
    .from("messages")
    .update({
      status: "approved",
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", id)
    .select();

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    });
  }

  if (!messageData || messageData.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Message not found",
    });
  }

  const message = messageData[0];

  // Attempt to enqueue an outbound send job
  // Placeholder: Check for a 'jobs' table and insert, otherwise simulate Twilio send
  try {
    const { error: jobError } = await client.from("jobs").insert({
      type: "send_message",
      payload: { messageId: message.id, content: message.content },
      status: "pending",
    });

    if (jobError) {
      if (jobError.code === "42P01") { // 42P01 is undefined_table
        console.warn("Jobs table not found. Simulating Twilio send.");
        // Simulate Twilio send
        // In a real application, you would integrate with Twilio API here.
        console.log(`Sending message ${message.id} via Twilio: ${message.content}`);

        // Update message status to 'sent' after successful Twilio send simulation
        await client
          .from("messages")
          .update({ status: "sent" })
          .eq("id", id);

      } else {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to enqueue job: ${jobError.message}`,
        });
      }
    }
  } catch (err) {
    console.error("Error enqueuing job or sending via Twilio placeholder:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error during send operation",
    });
  }

  return message;
});
