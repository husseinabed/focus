// ✅ Production-ready Template node (NEW schema typing)
// - Uses string labels only
// - Uses ObjectSchema config (type/object/properties/required)
// - Adds outputs schema + execute()
// - Safe (no eval). Optional safe {{path}} interpolation from inputs.in / inputs.$input
// - Returns: outputs.out = { rendered, selected, toggled, vars }

import { WorkflowNodeSchema } from "~/types/workflow_executer";

function getByPath(obj: any, path: string): any {
  const parts = String(path)
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveToken(token: string, inputs: Record<string, any>) {
  // Search in inputs.in first, then inputs.$input
  const inPayload = (inputs as any)?.in;
  const root = (inputs as any)?.$input;

  const v1 = inPayload !== undefined ? getByPath(inPayload, token) : undefined;
  if (v1 !== undefined) return v1;

  const v2 = root !== undefined ? getByPath(root, token) : undefined;
  if (v2 !== undefined) return v2;

  return undefined;
}

function safeInterpolate(template: string, inputs: Record<string, any>) {
  // Replace {{path.to.value}} with resolved values (stringified)
  // Unresolved tokens remain unchanged (safer than blanking).
  const vars: Record<string, any> = {};

  const rendered = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, rawPath) => {
    const path = String(rawPath).trim();
    const val = resolveToken(path, inputs);
    if (val === undefined) return `{{${path}}}`;
    vars[path] = val;
    if (val == null) return "";
    if (typeof val === "string") return val;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  });

  return { rendered, vars };
}

function clamp(s: string, max = 20_000) {
  return s.length <= max ? s : s.slice(0, max) + "…";
}

export const templateNodeSchema: WorkflowNodeSchema = {
  // ---- Identity ----
  type: "template",
  category: "actions",
  title: "workflow.nodes.actions.template.title",
  component: "TemplateNode",
  icon: "i-lucide-box",
  hint: "workflow.nodes.actions.template.hint",

  // ---- Ports ----
  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in" }],
    outputs: [{ id: "out", dataType: "flow", label: "workflow.ports.out" }],
  },

  // ---- Config (Inspector form) ----
  config: {
    type: "object",
    required: ["exampleText"],
    properties: {
      exampleText: {
        type: "string",
        label: "workflow.nodes.actions.template.exampleText.label",
        description: "workflow.nodes.actions.template.exampleText.description",
        placeholder: "workflow.nodes.actions.template.exampleText.placeholder",
        format: "textarea",
        required: true,
      },
      exampleSelect: {
        type: "string",
        label: "workflow.nodes.actions.template.exampleSelect.label",
        enum: ["option_a", "option_b", "option_c"],
        default: "option_a",
      },
      exampleToggle: {
        type: "boolean",
        label: "workflow.nodes.actions.template.exampleToggle.label",
        default: false,
      },
      enableInterpolation: {
        type: "boolean",
        label: "workflow.nodes.actions.template.enableInterpolation.label",
        description: "workflow.nodes.actions.template.enableInterpolation.description",
        default: true,
      },
    },
  },

  // ---- Outputs ----
  outputs: {
    type: "object",
    properties: {
      out: {
        type: "object",
        required: ["rendered", "selected", "toggled"],
        properties: {
          rendered: {
            type: "string",
            label: "workflow.nodes.actions.template.outputs.out.rendered",
            required: true,
          },
          selected: {
            type: "string",
            label: "workflow.nodes.actions.template.outputs.out.selected",
            required: true,
          },
          toggled: {
            type: "boolean",
            label: "workflow.nodes.actions.template.outputs.out.toggled",
            required: true,
          },
          vars: {
            type: "json",
            format: "json",
            label: "workflow.nodes.actions.template.outputs.out.vars",
          },
        },
      },
    },
  },

  // ---- UI ----
  ui: {
    renderer: "actions",
    tone: "neutral",
    width: 320,
  },

  // ---- Execution ----
  execution: {
    blocking: false,
    sideEffect: false,
  },

  // ---- Runtime ----
  execute({ config, inputs }) {
    const textRaw = String((config as any)?.exampleText ?? "").trim();
    if (!textRaw) {
      return {
        status: "failed",
        outputs: {},
        error: { code: "INVALID_CONFIG", message: "Template node requires exampleText." },
      };
    }

    const selected = String((config as any)?.exampleSelect ?? "option_a");
    const toggled = Boolean((config as any)?.exampleToggle);
    const enableInterpolation = (config as any)?.enableInterpolation !== false;

    const payload = (inputs as any)?.in ?? inputs ?? {};
    const baseText = clamp(textRaw, 20_000);

    let rendered = baseText;
    let vars: Record<string, any> = {};

    if (enableInterpolation) {
      const r = safeInterpolate(baseText, { ...inputs, in: payload });
      rendered = r.rendered;
      vars = r.vars;
    }

    return {
      status: "success",
      outputs: {
        out: {
          rendered,
          selected,
          toggled,
          vars,
        },
      },
    };
  },
} as const;
