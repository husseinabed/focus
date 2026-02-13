// server/api/projects/[id]/provision.post.ts
import { z } from "zod";
import { randomUUID } from "crypto";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { runProvision } from "~~/server/provision/runProvision";

const ParamsSchema = z.object({ id: z.string().min(1) });

const BodySchema = z
  .object({
    template: z.string().min(1).optional(),
  })
  .optional();

type JobStatus = "running" | "completed" | "failed";
type DeployStatus = "building" | "ready" | "error";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id: projectId } = ParamsSchema.parse(event.context.params ?? {});

  // Accept empty body (Phase 0/1 safe)
  const raw = await readBody(event).catch(() => undefined);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: "Validation error",
      data: parsed.error.errors,
    });
  }
  const body = parsed.data ?? {};

  const client = await serverSupabaseClient(event);

  // Ensure project exists (RLS enforces access)
  const { data: project, error: projErr } = await client
    .from("projects")
    .select("id, last_preview_url")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  // Idempotency-ish: if already has preview, allow redeploy via /redeploy.
  // Provision should still be allowed, but you may want to block duplicates later.

  const jobId = randomUUID();
  const deploymentId = randomUUID();

  // 1) Create job row
  const { data: job, error: jobErr } = await client
    .from("project_jobs")
    .insert({
      id: jobId,
      project_id: projectId,
      type: "provision",
      status: "running" as JobStatus,
      current_step: "starting",
      error: null,
    })
    .select()
    .single();

  if (jobErr) throw createError({ statusCode: 500, message: jobErr.message });

  // 2) Create deployment row (Phase 1-ready)
  // If you don't have deployments table yet, this will error—add the table or wrap in best-effort.
  const { data: deployment, error: depErr } = await client
    .from("deployments")
    .insert({
      id: deploymentId,
      project_id: projectId,
      status: "building" as DeployStatus,
      preview_url: null,
      vercel_deployment_id: null,
      branch: "main",
    })
    .select()
    .single();

  if (depErr) throw createError({ statusCode: 500, message: depErr.message });

  // 3) Emit first log line (optional but helps UI)
  // If you don't have deployment_events yet, you can remove this block or wrap best-effort.
  await client.from("deployment_events").insert({
    deployment_id: deployment.id,
    source: "provision",
    level: "info",
    message: "Provisioning started",
    payload: { template: body.template ?? null },
  });

   runProvision({ projectId, jobId: job.id, deploymentId: deployment.id, template: body.template, client } as any)

  return {
    ok: true,
    project_id: projectId,
    job_id: job.id,
    deployment_id: deployment.id,
    step: job.current_step,
    template: body.template ?? null,
  };
});
