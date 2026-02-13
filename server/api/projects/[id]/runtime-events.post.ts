// server/api/projects/[id]/runtime-events.post.ts
import { z } from "zod";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

const BodySchema = z.object({
  // optional for Phase 0 (you might not have deployments yet)
  deployment_id: z.string().uuid().optional(),

  level: z.enum(["info", "warn", "error"]).default("error"),
  message: z.string().min(1),

  // browser context (optional)
  url: z.string().optional(),
  user_agent: z.string().optional(),

  // raw console payload / stack / extra fields
  payload: z.unknown().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id: projectId } = ParamsSchema.parse(event.context.params ?? {});
  const body = BodySchema.parse(await readBody(event));

  const client = await serverSupabaseClient(event);

  // Ensure project exists (RLS enforces access)
  const { data: project, error: projErr } = await client
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  // Best-effort insert into deployment_events (Phase 0)
  // If you don't have deployments yet, you can keep deployment_id null.
  const { error } = await client.from("deployment_events").insert({
    deployment_id: body.deployment_id ?? null,
    source: "runtime",
    level: body.level,
    message: body.message,
    payload: {
      project_id: projectId,
      url: body.url,
      user_agent: body.user_agent,
      payload: body.payload ?? null,
    },
  });

  // If table missing / RLS blocks, don't fail Phase 0
  if (error) {
    return { ok: true, stored: false };
  }

  return { ok: true, stored: true };
});
