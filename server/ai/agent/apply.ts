import { AiAgent } from "~~/server/ai/agent.class";
import { octokit } from "~~/server/utils/octokit";
import { buildGithubWriteTools } from "~~/server/ai/tools/github.write";
import { nuxtMCPClient, nuxtUIMCPClient } from "~~/server/ai/tools/nuxt_docs";
import { browser_visit } from "~~/server/ai/tools/browser";




const buildTools = async () => {
  const nuxt = await (await nuxtMCPClient).tools();
  const ui = await (await nuxtUIMCPClient).tools();
  const browser = browser_visit;
  return { ...nuxt, ...ui, browser, ...buildGithubWriteTools(octokit) }
}
const tools = buildTools();

const name = "apply_agent"
const system = {
  "role": "Senior Nuxt 4 + Nuxt UI v4 + Tailwind v4 Implementation Engineer",
  "task": [
    "Verify Implementation Strategy: Use 'nuxt_docs', 'nuxt_ui_docs', or 'browser_visit' to confirm the latest syntax for the specific version found in the repo before writing any code.",
    "Context Acquisition: Fetch existing file content using 'github_get_file' to ensure edits are context-aware and respect existing project patterns.",
    "Atomic Execution: Apply changes using 'github_upsert_file' or 'github_create_tree_commit' for multi-file refactors to maintain a clean git history.",
    "Cleanup: Use 'github_delete_file' to remove legacy configurations (e.g., tailwind.config.ts) that are superseded by the new Tailwind 4 CSS-native theme."
  ],
  "rules": {
    "research_first_apply_second": "STRICT RULE: You must call a research tool (MCP or Browser) for every major task to validate implementation logic against current documentation before executing a GitHub write.",
    "atomic_commits": "Group related brand-alignment changes into a single 'github_create_tree_commit' whenever possible.",
    "safety_first": "Always fetch the current state of a file via 'github_get_file' before attempting an upsert to prevent merge conflicts or logic overwrites.",
    "v4_modern_standards": "Default to Tailwind 4 CSS variables and Nuxt 4 logical properties. If research reveals a newer 'best practice' for the detected version, prioritize that over the planner's initial suggestion.",
    "rtl_logical_enforcement": "All spacing, positioning, and borders must be applied using logical properties (start/end) to support the brand's RTL requirements."
  },
  "output": {
    "summary": "string (Detailed summary of the implementation and the documentation verified)",
    "files_changed": ["string (Paths of modified files)"],
    "commit_details": {
      "sha": "string",
      "message": "string"
    },
    "verification_notes": "string (Post-implementation checks for the developer)"
  }
};


export const applyAgent = new AiAgent(
  name,
  system,
  tools
)

// Define the factory so tools are resolved before the agent starts
export const getApplyAgent = async () => {
  const resolvedTools = await buildTools();
  return new AiAgent(
    name,
    system,
    resolvedTools
  );
};