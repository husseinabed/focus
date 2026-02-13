// ✅ Production-ready Done node schema
// - Explicit terminal semantics
// - Safe, deterministic execute()
// - Emits a final snapshot payload (useful for UI / audit / SSE)
// - Never throws (Done must always succeed)
// - Marks execution.terminal = true so the executor can stop expanding
import type { WorkflowNodeSchema } from "~/types/workflow_executer";

export const doneNodeSchema: WorkflowNodeSchema = {
  type: "done",
  category: "actions",
  title: "workflow.nodes.actions.done.title",

  icon: "i-lucide-check-circle",
  hint: "workflow.nodes.actions.done.hint",
  component: "ActionDone",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
    outputs: [], // terminal node
  },

  // Optional but recommended: explicit output schema
  // (even though there are no flow outputs)
  outputs: {
    type: "object",
    properties: {
      result: {
        type: "object",
        required: ["timestamp"],
        properties: {
          timestamp: {
            type: "string",
            label: "workflow.nodes.actions.done.outputs.timestamp",
            required: true,
          },
          nodeId: {
            type: "string",
            label: "workflow.nodes.actions.done.outputs.nodeId",
          },
          workflowId: {
            type: "string",
            label: "workflow.nodes.actions.done.outputs.workflowId",
          },
          input: {
            type: "json",
            format: "json",
            label: "workflow.nodes.actions.done.outputs.input",
          },
        },
      },
    },
  },

  ui: {
    renderer: "actions",
    tone: "success",
    width: 240,
  },

  execution: {
    blocking: true,
    terminal: true, // ✅ executor should stop expanding after this
  },

  // ✅ Runtime behavior
  execute({ inputs, ctx }) {
    return {
      status: "success",
      outputs: {
        result: {
          timestamp: new Date().toISOString(),
          nodeId: ctx.nodeId,
          workflowId: ctx.workflowId,
          // Pass-through final payload for inspection/debugging
          input: inputs?.in ?? inputs ?? {},
        },
      },
    };
  },
} as const;
