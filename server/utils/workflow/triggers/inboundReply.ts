// ✅ Production-ready Inbound Reply trigger schema (NEW schema typing)
// - string labels only
// - ObjectSchema config
// - explicit outputs schema
// - safe keyword filtering (no regex injection)
// - execute() never throws; emits out when matches, otherwise returns success with outputs:{} (no route)

import { WorkflowNodeSchema } from "~/types/workflow_executer";

function normalizeKeywords(raw: unknown): string[] {
    if (!raw) return [];
    const s = String(raw);
    return s
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 50); // safety cap
}

function includesAnyKeyword(text: string, keywords: string[]) {
    const t = text.toLowerCase();
    return keywords.some((k) => t.includes(k));
}

export const inboundReplyTriggerSchema: WorkflowNodeSchema = {
    type: "trigger-inbound_reply",
    category: "trigger",
    title: "workflow.nodes.trigger.inbound_reply.title",
    icon: "i-lucide-message-square-reply",
    hint: "workflow.nodes.trigger.inbound_reply.hint",
    component: "InboundReply",

    ports: {
        inputs: [],
        outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
    },

    config: {
        type: "object",
        required: ["inbox_id"],
        properties: {
            inbox_id: {
                type: "string",
                label: "workflow.nodes.trigger.inbound_reply.inbox_id",
                placeholder: "Enter inbox ID",
                required: true,
            },
            keywords: {
                type: "string",
                label: "workflow.nodes.trigger.inbound_reply.keywords",
                placeholder: "Comma-separated keywords (optional)",
            },
        },
    },

    outputs: {
        type: "object",
        properties: {
            out: {
                type: "object",
                required: ["timestamp", "inboxId", "message"],
                properties: {
                    timestamp: {
                        type: "string",
                        label: "workflow.nodes.trigger.inbound_reply.outputs.out.timestamp",
                        required: true,
                    },
                    inboxId: {
                        type: "string",
                        label: "workflow.nodes.trigger.inbound_reply.outputs.out.inboxId",
                        required: true,
                    },
                    conversationId: {
                        type: "string",
                        label: "workflow.nodes.trigger.inbound_reply.outputs.out.conversationId",
                    },
                    message: {
                        type: "json",
                        format: "json",
                        label: "workflow.nodes.trigger.inbound_reply.outputs.out.message",
                        required: true,
                    },
                    matchedKeywords: {
                        type: "json",
                        format: "json",
                        label: "workflow.nodes.trigger.inbound_reply.outputs.out.matchedKeywords",
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

        const inboxIdCfg = String((config as any)?.inbox_id ?? "").trim();
        if (!inboxIdCfg) {
            return {
                status: "failed",
                outputs: {},
                error: { code: "INVALID_CONFIG", message: "inbox_id is required." },
            };
        }

        // Expected payload from system/webhook runner
        // Prefer inputs.in if present
        const payload = (inputs as any)?.in ?? inputs ?? {};
        const inboxIdPayload = String((payload as any)?.inbox_id ?? (payload as any)?.inboxId ?? "").trim();

        // If payload inbox doesn't match configured inbox → do nothing (no out)
        if (inboxIdPayload && inboxIdPayload !== inboxIdCfg) {
            return { status: "success", outputs: {} };
        }

        const text =
            String((payload as any)?.text ?? (payload as any)?.message?.text ?? (payload as any)?.body ?? "").trim();

        const keywords = normalizeKeywords((config as any)?.keywords);
        if (keywords.length) {
            if (!text) return { status: "success", outputs: {} };

            const matched = keywords.filter((k) => text.toLowerCase().includes(k));
            if (!matched.length) return { status: "success", outputs: {} };

            return {
                status: "success",
                outputs: {
                    out: {
                        timestamp,
                        inboxId: inboxIdCfg,
                        conversationId: String((payload as any)?.conversation_id ?? (payload as any)?.conversationId ?? ""),
                        message: payload,
                        matchedKeywords: matched,
                    },
                },
            };
        }

        // No keyword filter → always start (for this inbox)
        return {
            status: "success",
            outputs: {
                out: {
                    timestamp,
                    inboxId: inboxIdCfg,
                    conversationId: String((payload as any)?.conversation_id ?? (payload as any)?.conversationId ?? ""),
                    message: payload,
                    matchedKeywords: [],
                },
            },
        };
    },
} as const;
