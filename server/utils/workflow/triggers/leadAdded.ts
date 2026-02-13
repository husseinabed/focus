// ✅ Production-ready Lead Added trigger schema (NEW schema typing)
// - string labels only
// - ObjectSchema config (type/object/properties/required)
// - explicit outputs schema
// - safe execute() (never throws)
// - blocking: false

import { WorkflowNodeSchema } from "~/types/workflow_executer";

export const leadAddedTriggerSchema: WorkflowNodeSchema = {
  type: "trigger-lead_added",
  category: "trigger",
  title: "workflow.nodes.trigger.lead_added.title",
  icon: "i-lucide-user-plus",
  hint: "workflow.nodes.trigger.lead_added.hint",
  component: "LeadAdded",

  ports: {
    inputs: [],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  config: {
    type: "object",
    properties: {
      source: {
        type: "string",
        label: "workflow.nodes.trigger.lead_added.source",
        enum: ["all", "manual", "scrape", "import"],
        default: "all",
      },
      min_priority: {
        type: "number",
        label: "workflow.nodes.trigger.lead_added.min_priority",
        default: 1,
        min: 1,
        max: 5,
      },
    },
  },

  outputs: {
    type: "object",
    properties: {
      out: {
        type: "object",
        required: ["timestamp", "lead"],
        properties: {
          timestamp: {
            type: "string",
            label: "workflow.nodes.trigger.lead_added.outputs.out.timestamp",
            required: true,
          },
          lead: {
            type: "json",
            format: "json",
            label: "workflow.nodes.trigger.lead_added.outputs.out.lead",
            required: true,
          },
          source: {
            type: "string",
            label: "workflow.nodes.trigger.lead_added.outputs.out.source",
          },
          priority: {
            type: "number",
            label: "workflow.nodes.trigger.lead_added.outputs.out.priority",
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

    // Expect upstream/system to pass lead payload in inputs.lead or inputs.in
    const lead = (inputs as any)?.lead ?? (inputs as any)?.in ?? inputs ?? {};

    const source = String((config as any)?.source ?? "all");
    const minPriorityRaw = (config as any)?.min_priority;
    const priority = typeof minPriorityRaw === "number" ? minPriorityRaw : Number(minPriorityRaw || 1);

    return {
      status: "success",
      outputs: {
        out: {
          timestamp,
          lead,
          source,
          priority: Number.isFinite(priority) ? priority : 1,
        },
      },
    };
  },
} as const;
