// server/api/projects/[id]/deployments.get.ts
import { z } from "zod";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id: projectId } = ParamsSchema.parse(event.context.params ?? {});
  const query = QuerySchema.parse(getQuery(event));

  const client = await serverSupabaseClient(event);

  // RLS should enforce access via project->workspace membership
  const { data, error } = await client
    .from("deployments")
    .select("id, project_id, status, preview_url, vercel_deployment_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(query.limit);

  if (error) throw createError({ statusCode: 500, message: error.message });

  return {
    ok: true,
    items: data ?? [],
  };
});
