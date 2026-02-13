// server/api/jobs/[job_id]/stream.get.ts
import { z } from "zod";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const ParamsSchema = z.object({ job_id: z.string().min(1) });

type JobStatus = "running" | "completed" | "failed";

type StreamEvent =
  | {
      type: "job";
      job_id: string;
      step: string;
      status: JobStatus;
      message?: string;
      ts: string;
    }
  | { type: "ping"; ts: string };

function isoNow() {
  return new Date().toISOString();
}

function sseWrite(event: any, payload: StreamEvent) {
  event.node.res.write(`event: ${payload.type}\n`);
  event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { job_id: jobId } = ParamsSchema.parse(event.context.params ?? {});

  event.node.res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const client = await serverSupabaseClient(event);

  let closed = false;
  event.node.req.on("close", () => {
    closed = true;
    clearInterval(ping);
    clearInterval(poll);
    event.node.res.end();
  });

  const ping = setInterval(() => {
    if (closed) return;
    sseWrite(event, { type: "ping", ts: isoNow() });
  }, 15000);

  // initial
  sseWrite(event, {
    type: "job",
    job_id: jobId,
    step: "connected",
    status: "running",
    message: "SSE connected",
    ts: isoNow(),
  });

  let lastKey = "";

  const poll = setInterval(async () => {
    if (closed) return;

    const { data: job, error } = await client
      .from("project_jobs")
      .select("id, status, current_step, error, updated_at")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      // if job not visible (RLS) or not found -> end
      sseWrite(event, {
        type: "job",
        job_id: jobId,
        step: "error",
        status: "failed",
        message: "Job not found (or not accessible)",
        ts: isoNow(),
      });
      clearInterval(ping);
      clearInterval(poll);
      event.node.res.end();
      return;
    }

    const key = `${job.status}|${job.current_step}|${job.error ?? ""}|${job.updated_at ?? ""}`;
    if (key === lastKey) return;
    lastKey = key;

    sseWrite(event, {
      type: "job",
      job_id: jobId,
      step: String(job.current_step ?? "starting"),
      status: job.status as JobStatus,
      message: job.error ? String(job.error) : undefined,
      ts: isoNow(),
    });

    if (job.status === "completed" || job.status === "failed") {
      clearInterval(ping);
      clearInterval(poll);
      event.node.res.end();
    }
  }, 800);
});
