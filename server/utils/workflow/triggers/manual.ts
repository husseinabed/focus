// ✅ Production-ready manual trigger schema
// - Adds explicit outputs schema (out payload) so downstream nodes get a consistent shape
// - Adds runtime execute() so it works the same in UI + server runs
// - Safe: does not mutate input, no side effects
// - Provides a predictable envelope: out = { input, trigger, timestamp }
import type { WorkflowNodeSchema } from "~/types/workflow_executer";

export const manualTriggerSchema: WorkflowNodeSchema = {
    type: "trigger-manual",
    category: "trigger",
    title: "workflow.nodes.trigger.manual.title",
    component: "Manual",
    icon: "i-lucide-mouse-pointer-click",
    hint: "workflow.nodes.trigger.manual.hint",

    ports: {
        inputs: [],
        outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
    },

    // ✅ empty ObjectSchema (valid)
    config: {
        type: "object",
        properties: {},
    },

    // ✅ explicit output schema (recommended)
    outputs: {
        type: "object",
        properties: {
            out: {
                type: "object",
                required: ["timestamp"],
                properties: {
                    timestamp: { type: "string", label: "workflow.nodes.trigger.manual.outputs.out.timestamp", required: true },
                    trigger: {
                        type: "object",
                        required: ["type"],
                        properties: {
                            type: { type: "string", label: "workflow.nodes.trigger.manual.outputs.out.trigger.type", required: true },
                        },
                    },
                    input: { type: "json", format: "json", label: "workflow.nodes.trigger.manual.outputs.out.input" },
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

    // ✅ runtime executor (so trigger produces an "out" payload)
    execute({ inputs, ctx }) {
        return {
            status: "success",
            outputs: {
                out: {
                    timestamp: new Date().toISOString(),
                    trigger: { type: "trigger-manual" },
                    // "inputs" on triggers may carry $input from the executor wiring; keep it safe + passthrough
                    input: (inputs as any)?.$input ?? inputs ?? {},
                },
            },
        };
    },
} as const;
