// ~/server/ai/tools/github.write.ts
import { z } from "zod";
import { tool } from "ai";
import type { Octokit } from "octokit";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function b64encode(text: string) {
    return Buffer.from(text, "utf8").toString("base64");
}

function b64decode(b64: string) {
    return Buffer.from(b64, "base64").toString("utf8");
}

/**
 * Accept both { owner, repo } and { owner, name } (envelope style).
 * Passthrough so extra keys don't break validation.
 */
const RepoRefInputSchema = z
    .object({
        owner: z.string().min(1),
        repo: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        ref: z.string().min(1).optional(), // branch
    })
    .passthrough();

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
    if (!repoName) throw new Error(`Missing repo reference. Expected { owner, repo|name, ref? }.`);

    return { owner, repo: repoName, ref };
}

async function tryGetFileSha(octokit: Octokit, args: { owner: string; repo: string; path: string; ref?: string }) {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner: args.owner,
            repo: args.repo,
            path: args.path,
            ref: args.ref,
        });

        if (Array.isArray(data) || data.type !== "file") return null;
        return data.sha ?? null;
    } catch (err: any) {
        const status = err?.status ?? err?.response?.status;
        if (status === 404) return null;
        throw err;
    }
}

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const CommitMetaSchema = z.object({
    message: z.string().min(1),
    committer: z
        .object({
            name: z.string().min(1),
            email: z.string().email(),
        })
        .optional(),
});

/* -------------------------------------------------------------------------- */
/* Tool Builder                                                               */
/* -------------------------------------------------------------------------- */

export function buildGithubWriteTools(octokit: Octokit) {
    return {
        /* ---------------------------------------------------------------------- */
        /* Get file SHA (and content)                                             */
        /* ---------------------------------------------------------------------- */

        github_get_file: tool({
            description:
                "Get a file's SHA and content from a GitHub repo. Input: { owner, repo|name, ref?, path }",
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
                    sha: data.sha,
                    size: data.size,
                    content: b64decode(data.content),
                };
            },
        }),

        /* ---------------------------------------------------------------------- */
        /* Upsert file (create or update)                                         */
        /* ---------------------------------------------------------------------- */

        github_upsert_file: tool({
            description:
                "Create or update a file in a GitHub repo. If sha is omitted and the file exists, sha will be auto-fetched. Input: { owner, repo|name, ref?, path, content, message, sha? }",
            // IMPORTANT: do NOT strict() here because agents may pass extra keys (and you said you want flexibility)
            parameters: RepoRefInputSchema.extend({
                path: z.string().min(1),
                content: z.string(),
                sha: z.string().min(1).optional(), // optional; auto-resolved if missing
                message: z.string().min(1),
                committer: CommitMetaSchema.shape.committer.optional(),
            }).passthrough(),
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);
                const path = (input as any).path as string;
                const content = (input as any).content as string;
                const message = (input as any).message as string;
                const committer = (input as any).committer as { name: string; email: string } | undefined;

                // If sha not provided, try to resolve it (only required when updating)
                let sha = (input as any).sha as string | undefined;
                if (!sha) {
                    const existingSha = await tryGetFileSha(octokit, { owner, repo, path, ref });
                    if (existingSha) sha = existingSha;
                }

                const { data } = await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path,
                    message,
                    content: b64encode(content),
                    sha, // present only for updates; omitted for creates
                    branch: ref, // branch name (optional)
                    committer, // optional
                });

                const commitSha = (data as any)?.commit?.sha ?? null;

                return {
                    ok: true,
                    path,
                    action: sha ? "update" : "create",
                    commit: {
                        sha: commitSha,
                        message,
                    },
                };
            },
        }),

        /* ---------------------------------------------------------------------- */
        /* Delete file                                                            */
        /* ---------------------------------------------------------------------- */

        github_delete_file: tool({
            description:
                "Delete a file in a GitHub repo. Input: { owner, repo|name, ref?, path, sha, message }",
            parameters: RepoRefInputSchema.extend({
                path: z.string().min(1),
                sha: z.string().min(1),
                message: z.string().min(1),
            }).passthrough(),
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);
                const path = (input as any).path as string;
                const sha = (input as any).sha as string;
                const message = (input as any).message as string;

                const { data } = await octokit.rest.repos.deleteFile({
                    owner,
                    repo,
                    path,
                    message,
                    sha,
                    branch: ref,
                });

                return {
                    ok: true,
                    path,
                    action: "delete",
                    commit: {
                        sha: (data as any)?.commit?.sha ?? null,
                        message,
                    },
                };
            },
        }),

        /* ---------------------------------------------------------------------- */
        /* Create commit via multiple file updates (optional helper)              */
        /* ---------------------------------------------------------------------- */

        github_create_tree_commit: tool({
            description:
                "Advanced: create a single commit from multiple file changes using git data API. Use only if requested. Input: { owner, repo|name, ref?, message, files:[{path, content}] }",
            parameters: RepoRefInputSchema.extend({
                message: z.string().min(1),
                files: z.array(
                    z.object({
                        path: z.string().min(1),
                        content: z.string(),
                    })
                ),
            }).passthrough(),
            execute: async (input) => {
                const { owner, repo, ref } = normalizeRepoRef(input);
                const message = (input as any).message as string;
                const files = (input as any).files as Array<{ path: string; content: string }>;

                // resolve base branch + commit
                const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo });
                const branch = ref ?? repoInfo.default_branch;

                const { data: refData } = await octokit.rest.git.getRef({
                    owner,
                    repo,
                    ref: `heads/${branch}`,
                });

                const baseCommitSha = (refData as any).object.sha as string;

                const { data: baseCommit } = await octokit.rest.git.getCommit({
                    owner,
                    repo,
                    commit_sha: baseCommitSha,
                });

                const baseTreeSha = (baseCommit as any).tree.sha as string;

                // create blobs
                const blobs = await Promise.all(
                    files.map(async (f) => {
                        const { data } = await octokit.rest.git.createBlob({
                            owner,
                            repo,
                            content: f.content,
                            encoding: "utf-8",
                        });
                        return { path: f.path, sha: (data as any).sha as string };
                    })
                );

                // create tree
                const { data: newTree } = await octokit.rest.git.createTree({
                    owner,
                    repo,
                    base_tree: baseTreeSha,
                    tree: blobs.map((b) => ({
                        path: b.path,
                        mode: "100644",
                        type: "blob",
                        sha: b.sha,
                    })),
                });

                // create commit
                const { data: newCommit } = await octokit.rest.git.createCommit({
                    owner,
                    repo,
                    message,
                    tree: (newTree as any).sha as string,
                    parents: [baseCommitSha],
                });

                // update ref
                await octokit.rest.git.updateRef({
                    owner,
                    repo,
                    ref: `heads/${branch}`,
                    sha: (newCommit as any).sha as string,
                });

                return {
                    ok: true,
                    commit: {
                        sha: (newCommit as any).sha as string,
                        message,
                    },
                    files: files.map((f) => f.path),
                };
            },
        }),
    };
}
