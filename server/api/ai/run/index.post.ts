// ~/server/api/ai/deploy/index.post.ts
import { saveRun } from "~~/server/state/runs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // if (!body.project) {
  //   throw createError({ statusCode: 400, message: "missing project" });
  // }

  const runId = crypto.randomUUID();

  saveRun(runId, body);

  return { ok: true, runId, body };
});
