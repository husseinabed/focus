// ✅ Production-ready log node:
// - No ANSI color codes (safe in server logs + JSON logs)
// - Validates config at runtime (no crashes on bad data)
// - Returns outputs that match the schema (out: { level, message, timestamp, includedContext })
// - Includes optional sanitized context snapshot (bounded) when includeContext=true
// - Never throws for log failures (logging should not break workflows)

import type { WorkflowNodeSchema } from "~/types/workflow_executer";


const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  try {
    return String(v);
  } catch {
    return fallback;
  }
}

function clampString(s: string, max = 4000): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function pickLevel(v: unknown): LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(String(v)) ? (v as LogLevel) : "info";
}

function safeJsonSnapshot(value: unknown, maxChars = 6000): unknown {
  // Make a JSON-safe, bounded snapshot. If it can't stringify, return a small marker.
  try {
    const json = JSON.stringify(value);
    if (json.length <= maxChars) return JSON.parse(json);
    return JSON.parse(json.slice(0, maxChars) + '"'); // will throw → fallback below
  } catch {
    // fallback: try shallow object clone
    if (isRecord(value)) {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(value).slice(0, 50)) out[k] = value[k];
      return out;
    }
    return { note: "unserializable_context" };
  }
}

export const loggingNodeSchema: WorkflowNodeSchema = {
  type: "log",
  category: "development",
  title: "workflow.nodes.actions.log.title",
  component: "ActionLog",
  icon: "i-lucide-file-text",
  hint: "workflow.nodes.utility.logging.hint",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  config: {
    type: "object",
    required: ["message"],
    properties: {
      level: {
        type: "string",
        label: "workflow.nodes.actions.log.level.label",
        description: "workflow.nodes.actions.log.level.description",
        enum: ["debug", "info", "warn", "error"],
        default: "info",
      },
      message: {
        type: "string",
        label: "workflow.nodes.actions.log.message.label",
        description: "workflow.nodes.actions.log.message.description",
        placeholder: "workflow.nodes.actions.log.message.placeholder",
        format: "textarea",
        required: true,
      },
      includeContext: {
        type: "boolean",
        label: "workflow.nodes.actions.log.includeContext.label",
        description: "workflow.nodes.actions.log.includeContext.description",
        default: true,
      },
    },
  },

  outputs: {
    type: "object",
    properties: {
      out: {
        type: "object",
        required: ["level", "message", "timestamp", "includedContext"],
        properties: {
          level: {
            type: "string",
            enum: ["debug", "info", "warn", "error"],
            label: "workflow.nodes.actions.log.outputs.out.level.label",
            required: true,
          },
          message: {
            type: "string",
            label: "workflow.nodes.actions.log.outputs.out.message.label",
            required: true,
          },
          timestamp: {
            type: "string",
            label: "workflow.nodes.actions.log.outputs.out.timestamp.label",
            required: true,
          },
          includedContext: {
            type: "boolean",
            label: "workflow.nodes.actions.log.outputs.out.includedContext.label",
            required: true,
          },
          // optional debug payload (not required)
          context: {
            type: "json",
            format: "json",
            label: "workflow.nodes.actions.log.outputs.out.context.label",
          },
        },
      },
    },
  },

  ui: {
    renderer: "actions",
    tone: "neutral",
    width: 320,
  },

  execution: {
    blocking: false,
    sideEffect: true,
  },

  execute({ config, inputs, ctx }) {
    const level = pickLevel((config as any)?.level);
    const rawMessage = safeString((config as any)?.message, "");
    const message = clampString(rawMessage, 4000);
    const includedContext = Boolean((config as any)?.includeContext);

    const timestamp = new Date().toISOString();

    // Context snapshot is bounded + JSON-safe (won't crash logs)
    const context = includedContext
      ? safeJsonSnapshot(
          {
            runId: ctx.runId,
            workflowId: ctx.workflowId,
            nodeId: ctx.nodeId,
            now: ctx.now,
            locale: ctx.locale,
            data: ctx.data,
            inputs,
          },
          8000
        )
      : undefined;

    // Structured log (best for production)
    const logPayload = {
      ts: timestamp,
      scope: "workflow",
      nodeType: "log",
      level,
      message,
      ...(includedContext ? { context } : {}),
    };

    // Choose console method based on level
    try {
      if (level === "error") console.error(logPayload);
      else if (level === "warn") console.warn(logPayload);
      else if (level === "debug") console.debug(logPayload);
      else console.log(logPayload);
    } catch {
      // never break workflow because logging failed
    }

    return {
      status: "success",
      outputs: {
        out: {
          level,
          message,
          timestamp,
          includedContext,
          ...(includedContext ? { context } : {}),
        },
      },
    };
  },
} as const;
