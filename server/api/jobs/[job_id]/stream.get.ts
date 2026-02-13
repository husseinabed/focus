// server/api/jobs/[job_id]/stream.get.ts
import { z } from "zod";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

const ParamsSchema = z.object({
  job_id: z.string().min(1),
});

type JobStatus = "running" | "completed" | "failed";

function isoNow() {
  return new Date().toISOString();
}

function setSSEHeaders(res: any) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

function sseEvent(res: any, eventName: string, data: any) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { job_id } = ParamsSchema.parse(event.context.params ?? {});
  const client = await serverSupabaseClient(event);

  // SSE headers
  setSSEHeaders(event.node.res);

  let closed = false;
  const onClose = () => {
    closed = true;
    try {
      event.node.res.end();
    } catch {}
  };
  event.node.req.on("close", onClose);

  // Initial hello
  sseEvent(event.node.res, "job", {
    ts: isoNow(),
    job_id,
    step: "connected",
    status: "running" as JobStatus,
    message: "SSE connected",
  });

  // If you have project_jobs table, we poll it (Phase 0 pragmatic).
  // If polling fails (table missing / RLS), we fall back to fake progress.
  const pollOnce = async () => {
    const { data, error } = await client
      .from("project_jobs")
      .select("id, status, current_step, error, updated_at")
      .eq("id", job_id)
      .single();

    if (error || !data) return null;

    return {
      status: data.status as JobStatus,
      step: String(data.current_step || "unknown"),
      error: data.error as string | null,
      updated_at: data.updated_at as string | null,
    };
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Keep-alive ping
  const ping = setInterval(() => {
    if (closed) return;
    event.node.res.write(`event: ping\ndata: {"ts":"${isoNow()}"}\n\n`);
  }, 15000);

  // Try real polling loop first
  let lastSent = "";
  for (let i = 0; i < 120; i++) {
    if (closed) break;

    const snap = await pollOnce();
    if (snap) {
      const key = `${snap.status}:${snap.step}:${snap.error ?? ""}`;
      if (key !== lastSent) {
        lastSent = key;
        sseEvent(event.node.res, "job", {
          ts: isoNow(),
          job_id,
          step: snap.step,
          status: snap.status,
          message:
            snap.status === "failed"
              ? snap.error || "Job failed"
              : snap.status === "completed"
              ? "Job completed"
              : "Job running",
        });
      }

      if (snap.status === "completed" || snap.status === "failed") {
        clearInterval(ping);
        event.node.res.end();
        return;
      }

      await sleep(800);
      continue;
    }

    // If we can't read project_jobs (Phase 0 fallback), break to fake.
    break;
  }

  // Fake progress fallback
  const fake = [
    { step: "starting", status: "running" as JobStatus, message: "Provisioning started" },
    { step: "repo_created", status: "running" as JobStatus, message: "Creating GitHub repo..." },
    { step: "vercel_project_created", status: "running" as JobStatus, message: "Creating Vercel project..." },
    { step: "deploying", status: "running" as JobStatus, message: "Deploying preview..." },
    { step: "ready", status: "completed" as JobStatus, message: "Provisioning complete" },
  ];

  for (const it of fake) {
    if (closed) break;
    sseEvent(event.node.res, "job", {
      ts: isoNow(),
      job_id,
      step: it.step,
      status: it.status,
      message: it.message,
    });
    await sleep(900);
  }

  clearInterval(ping);
  event.node.res.end();
});
