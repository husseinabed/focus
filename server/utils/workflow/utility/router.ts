// ✅ Production-ready "router" node schema
// Purpose:
// - Route flow to one of many output ports based on a selected key/value
// - Safe (NO eval). Supports:
//   1) mode: 'by_path'   -> read value from inputs via dot-path (e.g. lead.language)
//   2) mode: 'by_literal'-> use config.literal
// - Mapping decides which output handle to emit.
// - Always emits exactly ONE route handle (or "default").
// - Outputs include: { <handle>: payload, meta: {...} }
//
// Works with the executor update you made:
// - It routes by checking `result.outputs[handle]` existence.

import { WorkflowNodeSchema } from "~/types/workflow_executer";

export type RouterMode = "by_path" | "by_literal";

export type RouterRule = {
  match: string;       // value to match (stringified compare)
  route: string;       // output handle id to emit (must exist in outputs list)
};

export const routerNodeSchema: WorkflowNodeSchema = {
  type: "router",
  category: "logic",
  title: "workflow.nodes.utility.router.title",
  component: "ActionRouter",
  icon: "i-lucide-route",
  hint: "workflow.nodes.utility.router.hint",

  ports: {
    inputs: [{ id: "in", dataType: "flow", label: "workflow.ports.in"}] ,
    outputs: [
      { id: "a", dataType: "flow", label: "workflow.ports.a" },
      { id: "b", dataType: "flow", label: "workflow.ports.b" },
      { id: "c", dataType: "flow", label: "workflow.ports.c" },
      { id: "default", dataType: "flow", label: "workflow.ports.default" }
    ]
  },

  // ✅ Inspector config schema
  config: {
    type: "object",
    required: ["mode", "routes"],
    properties: {
      mode: {
        type: "string",
        label: "workflow.nodes.utility.router.mode.label",
        description: "workflow.nodes.utility.router.mode.description",
        enum: ["by_path", "by_literal"],
        default: "by_path"
      },
      path: {
        type: "string",
        label: "workflow.nodes.utility.router.path.label",
        description: "workflow.nodes.utility.router.path.description",
        placeholder: "e.g. lead.language",
      },
      literal: {
        type: "string",
        label: "workflow.nodes.utility.router.literal.label",
        description: "workflow.nodes.utility.router.literal.description",
        placeholder: "e.g. he",
      },
      routes: {
        type: "array",
        label: "workflow.nodes.utility.router.routes.label",
        description: "workflow.nodes.utility.router.routes.description",
        items: {
          type: "object",
          required: ["match", "route"],
          properties: {
            match: {
              type: "string",
              label: "workflow.nodes.utility.router.routes.match.label",
              required: true
            },
            route: {
              type: "string",
              label: "workflow.nodes.utility.router.routes.route.label",
              required: true,
              enum: ["a", "b", "c", "default"]
            }
          }
        }
      },
      defaultRoute: {
        type: "string",
        label: "workflow.nodes.utility.router.defaultRoute.label",
        enum: ["default", "a", "b", "c"],
        default: "default"
      }
    }
  },

  // ✅ Output schema (executor uses keys to route)
  outputs: {
    type: "object",
    properties: {
      a: { type: "json", format: "json", label: "workflow.nodes.utility.router.outputs.a" },
      b: { type: "json", format: "json", label: "workflow.nodes.utility.router.outputs.b" },
      c: { type: "json", format: "json", label: "workflow.nodes.utility.router.outputs.c" },
      default: { type: "json", format: "json", label: "workflow.nodes.utility.router.outputs.default" },
      meta: {
        type: "object",
        properties: {
          key: { type: "string", label: "workflow.nodes.utility.router.outputs.meta.key" },
          value: { type: "string", label: "workflow.nodes.utility.router.outputs.meta.value" },
          chosen: { type: "string", label: "workflow.nodes.utility.router.outputs.meta.chosen" }
        }
      }
    }
  },

  ui: {
    renderer: "actions",
    tone: "neutral",
    width: 340
  },

  execution: {
    blocking: false
  },

  execute({ config, inputs }) {
    const payload = (inputs as any)?.in ?? inputs ?? {};
    const mode = (config as any)?.mode === "by_literal" ? "by_literal" : "by_path";

    const routes = Array.isArray((config as any)?.routes) ? (config as any).routes as RouterRule[] : [];
    const defaultRoute = typeof (config as any)?.defaultRoute === "string" ? (config as any).defaultRoute : "default";

    const readPath = (obj: any, path: string) => {
      const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
      let cur = obj;
      for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
      }
      return cur;
    };

    let rawValue: any;
    let keyUsed = "";

    if (mode === "by_literal") {
      rawValue = (config as any)?.literal;
      keyUsed = "literal";
    } else {
      const path = typeof (config as any)?.path === "string" ? (config as any).path : "";
      if (!path) {
        return {
          status: "failed",
          outputs: {},
          error: { code: "INVALID_CONFIG", message: "Router mode=by_path requires config.path." }
        };
      }
      rawValue = readPath(payload, path);
      keyUsed = path;
    }

    const value = rawValue === undefined ? "" : String(rawValue);

    // choose route
    let chosen = defaultRoute;
    for (const r of routes) {
      if (!r || typeof r !== "object") continue;
      const match = String((r as any).match ?? "");
      const route = String((r as any).route ?? "");
      if (!route) continue;
      if (match === value) {
        chosen = route;
        break;
      }
    }

    // ensure chosen is valid
    const allowed = new Set(["a", "b", "c", "default"]);
    if (!allowed.has(chosen)) chosen = "default";

    return {
      status: "success",
      outputs: {
        [chosen]: payload,
        meta: { key: keyUsed, value, chosen }
      }
    };
  }
} as const;
