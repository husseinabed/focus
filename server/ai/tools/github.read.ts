// ~/server/ai/tools/github.read.ts
import { z } from "zod";
import { tool } from "ai";
import type { Octokit } from "octokit";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function b64decode(b64: string) {
    return Buffer.from(b64, "base64").toString("utf8");
}

/**
 * Accept both:
 *  - { owner, repo, ref? }  (canonical)
 *  - { owner, name, ref? }  (envelope style)
 */
const RepoRefInputSchema = z
    .object({
        owner: z.string().min(1, "owner is required"),
        repo: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        ref: z.string().min(1).optional(),
    })
    .passthrough(); // allow extra keys like path, recursive, etc.

const RepoRefSchema = z
    .object({
        owner: z.string().min(1),
        repo: z.string().min(1),
        ref: z.string().optional(),
    })
    .strict();

function normalizeRepoRef(input: unknown) {
    const parsed = RepoRefInputSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(
            `Missing repo reference. Expected { owner, repo|name, ref? }. Zod: ${parsed.error.issues
                .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
                .join("; ")}`
        );
    }

    const { owner, repo, name, ref } = parsed.data;
    const repoName = repo ?? name;

    if (!repoName) {
        throw new Error(`Missing repo reference. Expected { owner, repo|name, ref? }.`);
    }

    return RepoRefSchema.parse({ owner, repo: repoName, ref });
}

/* -------------------------------------------------------------------------- */
/* Tool Builders                                                              */
/* -------------------------------------------------------------------------- */

export function buildGithubReadTools(octokit: Octokit) {
    return {
        github_get_repo: tool({
            description: "Get basic repository info. Input: { owner, repo|name, ref? }",
            parameters: RepoRefInputSchema,
            execute: async (input) => {
                const { owner, repo } = normalizeRepoRef(input);

                const { data } = await octokit.rest.repos.get({ owner, repo });

                return {
                    owner: data.owner.login,
                    name: data.name,
                    full_name: data.full_name,
                    private: data.private,
                    default_branch: data.default_branch,
                    description: data.description,
                    archived: data.archived,
                    language: data.language,
                    topics: data.topics,
                };
            },
        }),

        github_get_repo_tree: tool({
            description:
                "List repository files using git tree. Input: { owner, repo|name, ref?, recursive?, pathPrefix? }",
            parameters: RepoRefInputSchema.extend({
                recursive: z.boolean().default(true),
                pathPrefix: z.string().min(1).optional(),
            }),
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);
                const recursive = (input as any).recursive ?? true;
                const pathPrefix = (input as any).pathPrefix as string | undefined;

                const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo });
                const branch = ref ?? repoInfo.default_branch;

                const { data: tree } = await octokit.rest.git.getTree({
                    owner,
                    repo,
                    tree_sha: branch,
                    recursive: recursive ? "true" : undefined,
                });

                const files = tree.tree
                    .filter((n) => n.type === "blob" || n.type === "tree")
                    .map((n) => ({ path: n.path!, type: n.type! }));

                return pathPrefix ? files.filter((f) => f.path.startsWith(pathPrefix)) : files;
            },
        }),

        github_read_file: tool({
            description: "Read a file from a GitHub repo. Input: { owner, repo|name, ref?, path }",
            parameters: RepoRefInputSchema.extend({
                path: z.string().min(1),
            }),
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);
                const path = (input as any).path as string;

                const { data } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path,
                    ref,
                });

                if (Array.isArray(data) || data.type !== "file" || !data.content) {
                    throw new Error(`Path is not a file: ${path}`);
                }

                return {
                    path,
                    size: data.size,
                    sha: data.sha,
                    content: b64decode(data.content),
                };
            },
        }),

        github_read_package_json: tool({
            description: "Read and parse package.json from repo root. Input: { owner, repo|name, ref? }",
            parameters: RepoRefInputSchema,
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);

                const { data } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: "package.json",
                    ref,
                });

                if (Array.isArray(data) || data.type !== "file" || !data.content) {
                    throw new Error("package.json not found");
                }

                const text = b64decode(data.content);
                const json = JSON.parse(text);

                return {
                    name: json.name ?? null,
                    private: json.private ?? null,
                    type: json.type ?? null,
                    scripts: json.scripts ?? {},
                    dependencies: Object.keys(json.dependencies ?? {}),
                    devDependencies: Object.keys(json.devDependencies ?? {}),
                };
            },
        }),
    };
}
