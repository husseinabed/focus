// server/api/webhooks/leads-insert.post.ts
import {
  defineEventHandler,
  readBody,
  getHeader,
  setHeader,
  createError,
} from "h3";

type SupabaseInsertPayload<T> = {
  type: "INSERT";
  table: string;
  schema: string;
  record: T;
  old_record: null;
};

type LeadRecord = {
  id: string;
  workspace_id: string;
  // הוסף פה את שדות ה-leads שלך לפי הסכימה
  // first_name?: string;
  // phone?: string;
  // company_name?: string;
  created_at?: string;
};

export default defineEventHandler(async (event) => {
  // 1) Verify secret (recommended)
  const config = useRuntimeConfig();
  const expectedSecret =
    process.env.SUPABASE_DB_WEBHOOK_SECRET || (config as any).supabaseDbWebhookSecret;
console.log(expectedSecret);

  if (!expectedSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing SUPABASE_DB_WEBHOOK_SECRET",
    });
  }

  // You should set this header in Supabase Webhook UI (Headers JSON)
  // Example: {"X-Webhook-Secret":"<your-secret>"}
  const gotSecret = (getHeader(event, "x-webhook-secret") || "").toString();

  if (gotSecret !== expectedSecret) {
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 401;
    return "Invalid webhook secret";
  }

  // 2) Parse JSON payload (Supabase DB Webhooks send JSON payload) :contentReference[oaicite:1]{index=1}
  const payload = (await readBody(event)) as SupabaseInsertPayload<LeadRecord>;

  // 3) Validate minimal shape
  if (!payload || payload.type !== "INSERT") {
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 400;
    return "Unsupported payload";
  }

  if (payload.table !== "leads") {
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 202; // accept but ignore
    return "Ignored (wrong table)";
  }

  const lead = payload.record;
  if (!lead?.id || !lead?.workspace_id) {
    setHeader(event, "content-type", "text/plain");
    event.node.res.statusCode = 400;
    return "Missing lead id/workspace_id";
  }

  // 4) Idempotency (basic): avoid double-processing if Supabase retries.
  // Option A: store processed ids in DB (recommended)
  // Option B: quick in-memory set (ONLY for dev)
  // TODO: implement DB-backed dedupe
  // await dedupeOrThrow(lead.id)

  // 5) Do lightweight work only (fast response)
  // TODO: enqueue job / call internal runner endpoint / insert into queue table
  console.log("[supabase][leads-insert]", {
    leadId: lead.id,
    workspaceId: lead.workspace_id,
  });

  setHeader(event, "content-type", "text/plain");
  return "ok";
});
