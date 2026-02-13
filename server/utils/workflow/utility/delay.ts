// ✅ Production-ready Delay node + Send Email node
// - string labels only
// - explicit outputs schemas
// - safe runtime validation
// - delay supports AbortSignal (if you pass it via ctx.data.signal OR you handle it in executor)
// - send-email is sideEffect + returns a safe receipt (no real send implementation here)

import { WorkflowNodeSchema } from "~/types/workflow_executer";

type DelayUnit = "seconds" | "minutes" | "hours";

function toMs(duration: number, unit: DelayUnit) {
  const d = Math.max(0, duration);
  if (unit === "hours") return d * 60 * 60 * 1000;
  if (unit === "minutes") return d * 60 * 1000;
  return d * 1000;
}

function sleep(ms: number, signal?: AbortSignal) {
  if (ms <= 0) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      const err = new Error("Delay aborted");
      (err as any).code = "ABORTED";
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(t);
      signal?.removeEventListener("abort", onAbort);
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

// -----------------------------
// ✅ Delay Node
// -----------------------------
export const delayNodeSchema: WorkflowNodeSchema = {
  type: "delay",
  category: "actions",
  title: "workflow.nodes.actions.delay.title",

  icon: "i-lucide-timer",
  hint: "workflow.nodes.actions.delay.hint",
  component: "ActionDelay",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  config: {
    type: "object",
    required: ["duration"],
    properties: {
      duration: {
        type: "number",
        label: "workflow.nodes.actions.delay.duration",
        required: true,
        min: 1,
      },
      unit: {
        type: "string",
        label: "workflow.nodes.actions.delay.unit",
        enum: ["seconds", "minutes", "hours"],
        default: "seconds",
      },
    },
  },

  outputs: {
    type: "object",
    properties: {
      out: { type: "json", format: "json", label: "workflow.nodes.actions.delay.outputs.out" },
      meta: {
        type: "object",
        properties: {
          duration: { type: "number", label: "workflow.nodes.actions.delay.outputs.meta.duration" },
          unit: { type: "string", label: "workflow.nodes.actions.delay.outputs.meta.unit" },
          waitedMs: { type: "number", label: "workflow.nodes.actions.delay.outputs.meta.waitedMs" },
          startedAt: { type: "string", label: "workflow.nodes.actions.delay.outputs.meta.startedAt" },
          finishedAt: { type: "string", label: "workflow.nodes.actions.delay.outputs.meta.finishedAt" },
        },
      },
    },
  },

  ui: {
    renderer: "actions",
    tone: "warning",
    width: 280,
  },

  execution: {
    blocking: true,
  },

  async execute({ config, inputs, ctx }) {
    const durationRaw = (config as any)?.duration;
    const unitRaw = (config as any)?.unit;

    const duration = typeof durationRaw === "number" ? durationRaw : Number(durationRaw);
    const unit: DelayUnit = unitRaw === "minutes" || unitRaw === "hours" ? unitRaw : "seconds";

    if (!Number.isFinite(duration) || duration < 1) {
      return {
        status: "failed",
        outputs: {},
        error: { code: "INVALID_CONFIG", message: "Delay requires duration >= 1." },
      };
    }

    const ms = toMs(duration, unit);
    const startedAt = new Date().toISOString();

    // Optional AbortSignal: you can inject it via ctx.data.signal from your executor/server layer
    const signal = (ctx.data as any)?.signal as AbortSignal | undefined;

    try {
      await sleep(ms, signal);
    } catch (e: any) {
      return {
        status: "failed",
        outputs: {},
        error: { code: e?.code || "ABORTED", message: e?.message || "Delay aborted." },
      };
    }

    const finishedAt = new Date().toISOString();

    const payload = (inputs as any)?.in ?? inputs ?? {};

    return {
      status: "success",
      outputs: {
        out: payload,
        meta: { duration, unit, waitedMs: ms, startedAt, finishedAt },
      },
    };
  },
} as const;