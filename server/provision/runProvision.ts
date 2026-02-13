// server/provision/runProvision.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { octokit } from "~~/server/utils/octokit";
// import { githubTools } from "~~/tools/github-tools";
import { vercel } from "~~/server/utils/vercel";

export type ProvisionStep =
  | "starting"
  | "github.clone_template"
  | "vercel.create_project"
  | "vercel.deploy_preview"
  | "ready"
  | "error";

export const PROVISION_STEPS: readonly ProvisionStep[] = [
  "starting",
  "github.clone_template",
  "vercel.create_project",
  "vercel.deploy_preview",
  "ready",
  "error",
] as const;

export type ProvisionRunnerInput = {
  client: SupabaseClient<any>;
  projectId: string;
  jobId: string;
  deploymentId: string;

  template?: string | null;
  github?: {
    template_full_name?: string; // e.g. "Brandi-Digital/starter-template"
    dest_owner?: string; // e.g. "Brandi-Digital"
    dest_repo?: string; // e.g. "my-new-site"
    private?: boolean;
  };
  vercel?: {
    framework?: "nuxtjs" | "nextjs";
  };
};

type LogLevel = "info" | "warn" | "error";
type DeploymentStatus = "building" | "ready" | "error";
type JobStatus = "running" | "completed" | "failed";

function nowIso() {
  return new Date().toISOString();
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function updateJob(
  client: SupabaseClient<any>,
  jobId: string,
  patch: Partial<{
    status: JobStatus;
    current_step: ProvisionStep;
    error: string | null;
  }>
) {
  const { error } = await client.from("project_jobs").update({ ...patch }).eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function updateDeployment(
  client: SupabaseClient<any>,
  deploymentId: string,
  patch: Partial<{
    status: DeploymentStatus;
    preview_url: string | null;
    vercel_deployment_id: string | null;
  }>
) {
  const { error } = await client.from("deployments").update({ ...patch }).eq("id", deploymentId);
  if (error) throw new Error(error.message);
}

async function updateProject(
  client: SupabaseClient<any>,
  projectId: string,
  patch: Partial<{
    repo: string | null;
    vercel_id: string | null;
    last_preview_url: string | null;
    status: "draft" | "active" | "archived";
  }>
) {
  const { error } = await client.from("projects").update(patch).eq("id", projectId);
  if (error) throw new Error(error.message);
}

async function logEvent(
  client: SupabaseClient<any>,
  deploymentId: string,
  level: LogLevel,
  message: string,
  payload?: any
) {
  const { error } = await client.from("deployment_events").insert({
    deployment_id: deploymentId,
    source: "provision",
    level,
    message,
    payload: payload ?? null,
  });
  if (error) return; // don't fail job on logging issues
}

function parseFullName(fullName?: string) {
  if (!fullName) return null;
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) return null;
  return { owner, repo };
}

function slugToRepoName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function ensureHttps(urlOrHost: string) {
  if (!urlOrHost) return urlOrHost;
  if (urlOrHost.startsWith("http://") || urlOrHost.startsWith("https://")) return urlOrHost;
  return `https://${urlOrHost}`;
}

const DEFAULT_ORG = process.env.GITHUB_ORG ?? "Brandi-Digital";
const DEFAULT_TEMPLATE_FULL =
  process.env.GITHUB_STARTER_TEMPLATE ?? `${DEFAULT_ORG}/starter-template`;

const DEFAULT_TEMPLATE = parseFullName(DEFAULT_TEMPLATE_FULL) ?? {
  owner: DEFAULT_ORG,
  repo: "starter-template",
};

const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || undefined; // recommended (team scope)
const VERCEL_SLUG = process.env.VERCEL_SLUG || undefined; // optional
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

// ---- Vercel helpers ----

async function vercelCreateProject(args: {
  name: string; // vercel project name
  framework: "nuxtjs" | "nextjs";
  repoFullName: string; // "org/repo"
}) {
  const res = await vercel.projects.createProject({
    ...(VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}),
    ...(VERCEL_SLUG ? { slug: VERCEL_SLUG } : {}),
    requestBody: {
      name: args.name,
      framework: args.framework,
      gitRepository: {
        type: "github",
        repo: args.repoFullName,
      },
    },
  });

  const id = (res as any)?.id as string | undefined;
  return { id, raw: res };
}

async function vercelCreateDeploymentFromGit(args: {
  projectName: string; // should match vercel project name
  repoId: string; // github numeric id as string
  ref: string; // branch, e.g. "main"
}) {
  const res = await vercel.deployments.createDeployment({
    ...(VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}),
    ...(VERCEL_SLUG ? { slug: VERCEL_SLUG } : {}),
    requestBody: {
      // minimal "deploy from git"
      name: args.projectName,
      project: args.projectName,
      target: "preview",
      gitSource: {
        type: "github",
        repoId: args.repoId,
        ref: args.ref,
      },
    },
  });

  const id = (res as any)?.id as string | undefined;
  const url = (res as any)?.url as string | undefined;
  const readyState = (res as any)?.readyState as string | undefined;

  return { id, url, readyState, raw: res };
}

async function vercelGetDeployment(idOrUrl: string) {
  const res = await vercel.deployments.getDeployment({
    ...(VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}),
    ...(VERCEL_SLUG ? { slug: VERCEL_SLUG } : {}),
    idOrUrl,
  });

  const id = (res as any)?.id as string | undefined;
  const url = (res as any)?.url as string | undefined;
  const readyState = (res as any)?.readyState as string | undefined; // "READY" | "ERROR" | ...
  const errorMessage =
    (res as any)?.errorMessage ||
    (res as any)?.readyStateReason ||
    (res as any)?.error ||
    undefined;

  return { id, url, readyState, errorMessage, raw: res };
}

async function pollVercelDeployment(args: {
  id: string;
  client: SupabaseClient<any>;
  deploymentId: string; // our DB deployment row id
  log: (level: LogLevel, msg: string, payload?: any) => Promise<void>;
  timeoutMs?: number;
  intervalMs?: number;
}) {
  const timeoutMs = args.timeoutMs ?? 12 * 60 * 1000; // 12m
  const intervalMs = args.intervalMs ?? 4000;

  const started = Date.now();
  let lastState: string | null = null;

  while (Date.now() - started < timeoutMs) {
    const d = await vercelGetDeployment(args.id);

    if (d.readyState && d.readyState !== lastState) {
      lastState = d.readyState;
      await args.log("info", `Vercel deployment state: ${d.readyState}`, {
        ts: nowIso(),
        readyState: d.readyState,
      });
    }

    if (d.readyState === "READY") {
      const finalUrl = d.url ? ensureHttps(d.url) : null;

      await updateDeployment(args.client, args.deploymentId, {
        status: "ready",
        preview_url: finalUrl,
        vercel_deployment_id: d.id ?? args.id,
      });

      return { ok: true as const, previewUrl: finalUrl, vercelDeploymentId: d.id ?? args.id };
    }

    if (d.readyState === "ERROR") {
      const msg = d.errorMessage || "Vercel deployment failed";
      await updateDeployment(args.client, args.deploymentId, { status: "error" });
      return { ok: false as const, error: msg };
    }

    await sleep(intervalMs);
  }

  await updateDeployment(args.client, args.deploymentId, { status: "error" });
  return { ok: false as const, error: "Vercel deployment timed out" };
}

/**
 * Phase 1: Provision runner
 * - GitHub: REAL (create repo from template)
 * - Vercel: REAL (createProject + createDeployment + poll)
 *
 * IMPORTANT:
 * - `input.client` MUST be service-role supabase client, otherwise RLS will block.
 */
export async function runProvision(input: ProvisionRunnerInput) {
  const { client, projectId, jobId, deploymentId } = input;

  let repoFullName: string | null = null;
  let vercelProjectId: string | null = null;

  const log = (level: LogLevel, message: string, payload?: any) =>
    logEvent(client, deploymentId, level, message, payload);

  try {
    // STEP: starting
    await updateJob(client, jobId, { status: "running", current_step: "starting", error: null });
    await updateDeployment(client, deploymentId, { status: "building" });
    await log("info", "Provisioning started", { ts: nowIso(), template: input.template ?? null });

    // STEP: github.clone_template
    await updateJob(client, jobId, { current_step: "github.clone_template" });

    const template = parseFullName(input.github?.template_full_name) ?? DEFAULT_TEMPLATE;
    const destOwner = input.github?.dest_owner ?? DEFAULT_ORG;
    const destRepo =
      input.github?.dest_repo ?? slugToRepoName(`project-${projectId.slice(0, 8)}`);

    await log("info", "Creating repository from template…", {
      ts: nowIso(),
      template: `${template.owner}/${template.repo}`,
      dest: `${destOwner}/${destRepo}`,
    });

    const ghRes = await githubTools.create_repo_from_template.handler(octokit as any, {
      template_owner: template.owner,
      template_repo: template.repo,
      owner: destOwner,
      name: destRepo,
      description: `Project ${projectId}`,
      private: input.github?.private ?? true,
      include_all_branches: false,
    });

    if (!ghRes?.ok || !ghRes?.repo?.full_name) {
      throw new Error("GitHub: failed to create repo from template");
    }

    repoFullName = ghRes.repo.full_name;

    await updateProject(client, projectId, { repo: repoFullName });
    await log("info", "GitHub repository created", { ts: nowIso(), repo: ghRes.repo });

    // STEP: vercel.create_project
    await updateJob(client, jobId, { current_step: "vercel.create_project" });

    if (!VERCEL_TOKEN) {
      throw new Error("Missing VERCEL_TOKEN (server/utils/vercel.ts bearerToken is empty)");
    }

    await log("info", "Creating Vercel project (import GitHub)…", {
      ts: nowIso(),
      repo: repoFullName,
      teamId: VERCEL_TEAM_ID ?? null,
      slug: VERCEL_SLUG ?? null,
      framework: input.vercel?.framework ?? "nuxtjs",
    });

    const vp = await vercelCreateProject({
      name: destRepo,
      framework: input.vercel?.framework ?? "nuxtjs",
      repoFullName,
    });

    vercelProjectId = vp.id ?? null;
    if (!vercelProjectId) throw new Error("Vercel: createProject did not return id");

    await updateProject(client, projectId, { vercel_id: vercelProjectId });
    await log("info", "Vercel project created", {
      ts: nowIso(),
      vercel_project_id: vercelProjectId,
      name: (vp.raw as any)?.name ?? destRepo,
    });

    // STEP: vercel.deploy_preview (REAL)
    await updateJob(client, jobId, { current_step: "vercel.deploy_preview" });

    // Get GitHub numeric repo id (needed by Vercel gitSource)
    const [ghOwner, ghRepo] = repoFullName.split("/");
    const ghRepoInfo = await octokit.request("GET /repos/{owner}/{repo}", {
      owner: ghOwner,
      repo: ghRepo,
    });

    const githubRepoId = String((ghRepoInfo.data as any)?.id ?? "");
    const defaultBranch = String((ghRepoInfo.data as any)?.default_branch ?? "main");

    if (!githubRepoId) throw new Error("GitHub: could not resolve repoId for Vercel deployment");

    await log("info", "Creating Vercel deployment (preview)…", {
      ts: nowIso(),
      project: destRepo,
      repoId: githubRepoId,
      ref: defaultBranch,
    });

    const vd = await vercelCreateDeploymentFromGit({
      projectName: destRepo,
      repoId: githubRepoId,
      ref: defaultBranch,
    });

    const vercelDeploymentId = vd.id ?? null;
    if (!vercelDeploymentId) {
      throw new Error("Vercel: createDeployment did not return id");
    }

    // Persist immediately so UI can reference it
    await updateDeployment(client, deploymentId, {
      status: "building",
      vercel_deployment_id: vercelDeploymentId,
      preview_url: vd.url ? ensureHttps(vd.url) : null,
    });

    await log("info", "Vercel deployment created", {
      ts: nowIso(),
      vercel_deployment_id: vercelDeploymentId,
      readyState: vd.readyState ?? null,
      url: vd.url ? ensureHttps(vd.url) : null,
    });

    // Poll until READY / ERROR
    const poll = await pollVercelDeployment({
      id: vercelDeploymentId,
      client,
      deploymentId,
      log,
    });

    if (!poll.ok) throw new Error(poll.error);

    // Update project "last_preview_url" with the final URL
    await updateProject(client, projectId, { last_preview_url: poll.previewUrl });
    await log("info", "Preview ready", {
      ts: nowIso(),
      preview_url: poll.previewUrl,
      vercel_deployment_id: poll.vercelDeploymentId,
    });

    // STEP: ready
    await updateJob(client, jobId, { status: "completed", current_step: "ready", error: null });
    await log("info", "Provisioning completed", { ts: nowIso() });

    return { ok: true as const, repo: repoFullName, vercel_id: vercelProjectId };
  } catch (err: any) {
    const msg = err?.message || "Provisioning failed";

    try {
      await updateJob(client, jobId, { status: "failed", current_step: "error", error: msg });
    } catch {}

    try {
      await updateDeployment(client, deploymentId, { status: "error" });
    } catch {}

    try {
      await log("error", msg, { ts: nowIso() });
    } catch {}

    console.error(msg);
    return { ok: false as const, error: msg };
  }
}
