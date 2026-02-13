// ✅ Production-ready Scheduled trigger schema (NEW schema typing)
// - string labels only
// - ObjectSchema config
// - explicit outputs schema
// - safe cron validation (basic 5-part cron; no libs required)
// - execute() never throws; if payload doesn't match schedule_id (optional) returns outputs:{}

import { WorkflowNodeSchema } from "~/types/workflow_executer";

function isBasicCron5(expr: string) {
  // Basic safety: 5 space-separated fields, allow digits, * / , - ?
  // (Not full cron validation, but blocks obvious junk)
  const s = expr.trim();
  const parts = s.split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p) => /^[\d*/,\-?]+$/.test(p));
}

export const scheduledTriggerSchema: WorkflowNodeSchema = {
  type: "trigger-scheduled",
  category: "trigger",
  title: "workflow.nodes.trigger.scheduled.title",
  icon: "i-lucide-clipboard-clock",
  hint: "workflow.nodes.trigger.scheduled.hint",
  component: "Scheduled",

  ports: {
    inputs: [],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  config: {
    type: "object",
    required: ["cron_expression"],
    properties: {
      cron_expression: {
        type: "string",
        label: "workflow.nodes.trigger.scheduled.cron_expression",
        placeholder: "e.g., 0 0 * * * (daily at midnight)",
        required: true,
      },
      timezone: {
        type: "string",
        label: "workflow.nodes.trigger.scheduled.timezone",
        placeholder: "Asia/Jerusalem",
        default: "Asia/Jerusalem",
      },
      schedule_id: {
        type: "string",
        label: "workflow.nodes.trigger.scheduled.schedule_id",
        placeholder: "Optional scheduler job id",
      },
    },
  },

  outputs: {
    type: "object",
    properties: {
      out: {
        type: "object",
        required: ["timestamp", "cron", "timezone"],
        properties: {
          timestamp: {
            type: "string",
            label: "workflow.nodes.trigger.scheduled.outputs.out.timestamp",
            required: true,
          },
          cron: {
            type: "string",
            label: "workflow.nodes.trigger.scheduled.outputs.out.cron",
            required: true,
          },
          timezone: {
            type: "string",
            label: "workflow.nodes.trigger.scheduled.outputs.out.timezone",
            required: true,
          },
          scheduleId: {
            type: "string",
            label: "workflow.nodes.trigger.scheduled.outputs.out.scheduleId",
          },
          payload: {
            type: "json",
            format: "json",
            label: "workflow.nodes.trigger.scheduled.outputs.out.payload",
          },
        },
      },
    },
  },

  ui: {
    renderer: "trigger",
    tone: "primary",
    width: 280,
  },

  execution: {
    blocking: false,
  },

  execute({ config, inputs }) {
    const timestamp = new Date().toISOString();

    const cron = String((config as any)?.cron_expression ?? "").trim();
    const timezone = String((config as any)?.timezone ?? "Asia/Jerusalem").trim() || "Asia/Jerusalem";
    const scheduleIdCfg = String((config as any)?.schedule_id ?? "").trim();

    if (!cron) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_CONFIG", message: "cron_expression is required." } };
    }
    if (!isBasicCron5(cron)) {
      return { status: "failed", outputs: {}, error: { code: "INVALID_CRON", message: "cron_expression must be a basic 5-part cron string." } };
    }

    // Expected payload from your scheduler runner (optional):
    // { schedule_id, fired_at, ... }
    const payload = (inputs as any)?.in ?? inputs ?? {};
    const scheduleIdPayload = String((payload as any)?.schedule_id ?? (payload as any)?.scheduleId ?? "").trim();

    // If config has schedule_id, only fire when payload matches
    if (scheduleIdCfg && scheduleIdPayload && scheduleIdPayload !== scheduleIdCfg) {
      return { status: "success", outputs: {} };
    }

    return {
      status: "success",
      outputs: {
        out: {
          timestamp,
          cron,
          timezone,
          scheduleId: scheduleIdCfg || scheduleIdPayload || "",
          payload,
        },
      },
    };
  },
} as const;
