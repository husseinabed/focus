// server/ai/tools/stateStore.ts
import { tool } from "ai";
import { z } from "zod";
import type { ToolSet } from "ai";
import type { StateStore } from "../state/store";

const StateStoreToolInput = z.object({
  action: z.enum(["get", "set", "keys"]),
  key: z.string().optional(),
  value: z.any().optional(),
});

export function buildStateStoreTools(store: StateStore): ToolSet {
  return {
    state_store: tool({
      description: "Read/write orchestrator runtime state. Actions: get, set, keys.",
      inputSchema: StateStoreToolInput,
      execute: async ({ action, key, value }) => {
        switch (action) {
          case "get":
            if (!key) throw new Error("Missing key for get");
            return store.get(key);

          case "set":
            if (!key) throw new Error("Missing key for set");
            store.set(key, value);
            return { ok: true };

          case "keys":
            return store.keys();
        }
      },
    }),
  };
}
