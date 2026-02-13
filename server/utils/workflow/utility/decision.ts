// ✅ Production-ready Decision node
// - Safe evaluation (NO eval / Function)
// - Supports simple comparisons with {{path}} tokens:
//   "{{lead.priority}} > 3", "{{lead.status}} == interested", "{{score}} >= 10"
// - Supported operators: ==, !=, >, >=, <, <=
// - Types: number + string + boolean + null
// - Output routing: emits either outputs.true or outputs.false (flow)
// - Never throws on bad condition; returns failed with error (so executor can route/stop)

import { NodeContext, WorkflowNodeSchema } from "~/types/workflow_executer";

type DecisionOp = "==" | "!=" | ">" | ">=" | "<" | "<=";

 

function getByPath(obj: any, path: string): any {
    const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
    let cur = obj;
    for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
    }
    return cur;
}

function parseLiteral(raw: string): any {
    const s = raw.trim();

    // booleans/null
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;

    // quoted strings
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        return s.slice(1, -1);
    }

    // number
    const n = Number(s);
    if (!Number.isNaN(n) && s !== "") return n;

    // bare word string (e.g. interested)
    return s;
}

function coerceForCompare(a: any, b: any) {
    // If both look numeric, compare as numbers
    const an = typeof a === "string" ? Number(a) : a;
    const bn = typeof b === "string" ? Number(b) : b;
    if (typeof an === "number" && typeof bn === "number" && !Number.isNaN(an) && !Number.isNaN(bn)) {
        return { a: an, b: bn };
    }
    // Otherwise compare as strings for ==/!=, and attempt numeric for inequalities if possible
    return { a, b };
}

function compare(op: DecisionOp, left: any, right: any): boolean {
    const { a, b } = coerceForCompare(left, right);

    switch (op) {
        case "==":
            // eslint-disable-next-line eqeqeq
            return a == b;
        case "!=":
            // eslint-disable-next-line eqeqeq
            return a != b;
        case ">":
            return a > b;
        case ">=":
            return a >= b;
        case "<":
            return a < b;
        case "<=":
            return a <= b;
        default:
            return false;
    }
}

// Parses: "<left> <op> <right>"
// left/right can be:
// - {{path.to.value}}
// - literal: 3, "hi", true, false, null, interested
function parseDecisionExpression(expr: string): { left: string; op: DecisionOp; right: string } | null {
    const s = expr.trim();

    // order matters: >=, <=, !=, ==, >, <
    const ops: DecisionOp[] = [">=", "<=", "!=", "==", ">", "<"];

    for (const op of ops) {
        const idx = s.indexOf(op);
        if (idx > -1) {
            const left = s.slice(0, idx).trim();
            const right = s.slice(idx + op.length).trim();
            if (!left || !right) return null;
            return { left, op, right };
        }
    }
    return null;
}

function resolveValue(token: string, inputs: Record<string, any>, ctx: NodeContext): any {
    // Support {{path}} lookups from:
    // 1) inputs.in
    // 2) inputs.$input (original input)
    // 3) ctx.data
    const m = token.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (!m) return parseLiteral(token);

    const path = m[1].trim();

    // Try inputs.in first
    const inPayload = inputs?.in;
    if (inPayload !== undefined) {
        const v = getByPath(inPayload, path);
        if (v !== undefined) return v;
    }

    // Then original input
    const rootInput = (inputs as any)?.$input;
    if (rootInput !== undefined) {
        const v = getByPath(rootInput, path);
        if (v !== undefined) return v;
    }

    // Then ctx.data
    if (ctx?.data) {
        const v = getByPath(ctx.data, path);
        if (v !== undefined) return v;
    }

    return undefined;
}

export const decisionNodeSchema: WorkflowNodeSchema = {
    type: "decision",
    category: "logic",
    title: "workflow.nodes.actions.decision.title",

    icon: "i-lucide-git-commit",
    hint: "workflow.nodes.actions.decision.hint",
    component: "ActionDecision",

    ports: {
        inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
        outputs: [
            { id: "true", dataType: "flow", label: "workflow.ports.true" },
            { id: "false", dataType: "flow", label: "workflow.ports.false" },
        ],
    },

    config: {
        type: "object",
        required: ["condition"],
        properties: {
            condition: {
                type: "string",
                label: "workflow.nodes.actions.decision.condition",
                placeholder: "e.g., {{lead.priority}} > 3",
                required: true,
            },
        },
    },

    outputs: {
        type: "object",
        properties: {
            true: { type: "json", format: "json", label: "workflow.nodes.actions.decision.outputs.true" },
            false: { type: "json", format: "json", label: "workflow.nodes.actions.decision.outputs.false" },
            meta: {
                type: "object",
                properties: {
                    matched: { type: "boolean", required: true, label: "workflow.nodes.actions.decision.outputs.meta.matched" },
                    left: { type: "json", format: "json", label: "workflow.nodes.actions.decision.outputs.meta.left" },
                    right: { type: "json", format: "json", label: "workflow.nodes.actions.decision.outputs.meta.right" },
                    op: { type: "string", label: "workflow.nodes.actions.decision.outputs.meta.op" },
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
        blocking: false,
    },

    execute({ config, inputs, ctx }) {
        const condition = (config as any)?.condition;
        if (typeof condition !== "string" || !condition.trim()) {
            return {
                status: "failed",
                outputs: {},
                error: { code: "INVALID_CONFIG", message: "Decision node requires a non-empty condition string." },
            };
        }

        const parsed = parseDecisionExpression(condition);
        if (!parsed) {
            return {
                status: "failed",
                outputs: {},
                error: {
                    code: "INVALID_CONDITION",
                    message: "Invalid condition format. Use: <left> <op> <right> (e.g. {{lead.priority}} > 3).",
                    details: { condition },
                },
            };
        }

        const leftVal = resolveValue(parsed.left, inputs, ctx);
        const rightVal = resolveValue(parsed.right, inputs, ctx);

        // If a {{path}} doesn't resolve, fail (safer than silently false)
        if (parsed.left.includes("{{") && leftVal === undefined) {
            return {
                status: "failed",
                outputs: {},
                error: { code: "UNRESOLVED_LEFT", message: `Unresolved left token: ${parsed.left}`, details: { condition } },
            };
        }
        if (parsed.right.includes("{{") && rightVal === undefined) {
            return {
                status: "failed",
                outputs: {},
                error: { code: "UNRESOLVED_RIGHT", message: `Unresolved right token: ${parsed.right}`, details: { condition } },
            };
        }

        let matched = false;
        try {
            matched = compare(parsed.op, leftVal, rightVal);
        } catch (e: any) {
            return {
                status: "failed",
                outputs: {},
                error: { code: "COMPARE_ERROR", message: e?.message || "Failed to evaluate decision.", details: { leftVal, rightVal } },
            };
        }

        const payload = inputs?.in ?? inputs ?? {};
        return {
            status: "success",
            outputs: {
                ...(matched ? { true: payload } : { false: payload }),
                meta: { matched, left: leftVal, right: rightVal, op: parsed.op },
            },
        };
    },
} as const;
