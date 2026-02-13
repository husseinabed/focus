import { z } from "zod";
import { randomUUID } from "crypto";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { getProject } from "~~/server/utils/projectsStore";

const ParamsSchema = z.object({ id: z.string().min(1) });

type JobRow = {
  id: string;
  project_id: string;
  type: "redeploy";
  status: "running" | "completed" | "failed";
  current_step: string;
  error: string | null;
};

async function tryInsertJob(event: any, row: JobRow) {
  const client = await serverSupabaseClient(event);
  const { data, error } = await client.from("project_jobs").insert(row).select().single();
  if (error) return null;
  return data as JobRow;
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id: projectId } = ParamsSchema.parse(event.context.params ?? {});
  const project = await getProject(event, projectId);
  if (!project) throw createError({ statusCode: 404, message: "Project not found" });

  const jobId = randomUUID();

  // best-effort job row
  await tryInsertJob(event, {
    id: jobId,
    project_id: projectId,
    type: "redeploy",
    status: "running",
    current_step: "deploying",
    error: null,
  });

  // Phase 0: we don't actually call Vercel yet.
  // Phase 1: trigger vercel deployment using project.vercel_id, return deployment info.
  return {
    ok: true,
    project_id: projectId,
    job_id: jobId,
    message: "Redeploy enqueued (Phase 0 stub).",
  };
});
