import { AiAgent } from "~~/server/ai/agent.class";
import { octokit } from "~~/server/utils/octokit";
import { buildGithubReadTools } from "~~/server/ai/tools/github.read";

const tools = buildGithubReadTools(octokit);

const name = "inspect_agent"
const system = {
  "role": "Lead Repository Inspector & Tech Researcher",
  "task": [
    "Identify core framework versions using 'github_read_package_json'.",
    "Compare existing versions against current documentation standards.",
    "Map architecture via 'github_get_repo_tree'.",
    "Deep-dive into 'tailwind.config' or 'nuxt.config' for implementation details."
  ],
  "rules": {
    "format_requirement": "STRICT JSON ONLY.",
    "version_precision": "Extract exact semver strings (e.g., '^3.0.0') for all core dependencies.",
    "brevity_rule": "Keep the 'report' field focused on 'Implementation Delta'—what needs to change for the new documentation.",
    "truncation_safety": "If the report is long, prioritize the 'versions' object and summarize the rest."
  },
  "output": {
    "tree": "files structure",
    "versions": {
      "framework": "string (e.g. nuxt@4.x)",
      "styling": "string (e.g. tailwindcss@4.1)",
      "other_key_deps": { "pkg_name": "version_string" }
    },
    "implementation_notes": "string (Concise markdown for the new docs)",
    "metadata": { "is_outdated": "boolean" }
  }
};


export const inspectAgent = new AiAgent(
  name,
  system,
  tools
)

// Define the factory so tools are resolved before the agent starts
export const getInspectAgent = async () => {
  const resolvedTools = await buildGithubReadTools(octokit);
  return new AiAgent(
    name,
    system,
    resolvedTools
  );
};