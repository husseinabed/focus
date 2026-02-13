// server/api/projects/[id]/deployments/[deploymentId]/logs.get.ts
import { z } from "zod";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const ParamsSchema = z.object({
  id: z.string().uuid(),
  deploymentId: z.string().uuid(),
});

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id: projectId, deploymentId } = ParamsSchema.parse(event.context.params ?? {});
  const client = await serverSupabaseClient(event);

  // Verify deployment belongs to project (extra safety)
  const { data: dep, error: depErr } = await client
    .from("deployments")
    .select("id, project_id")
    .eq("id", deploymentId)
    .single();

  if (depErr || !dep) throw createError({ statusCode: 404, message: "Deployment not found" });
  if (dep.project_id !== projectId) throw createError({ statusCode: 404, message: "Deployment not found" });

  const { data, error } = await client
    .from("deployment_events")
    .select("id, deployment_id, level, message, payload, created_at")
    .eq("deployment_id", deploymentId)
    .order("created_at", { ascending: true });

  if (error) throw createError({ statusCode: 500, message: error.message });

  return {
    ok: true,
    items: data ?? [],
  };
});
