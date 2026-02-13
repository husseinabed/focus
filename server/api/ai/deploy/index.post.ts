// ~/server/api/ai/deploy/index.post.ts
import { saveRun } from "~~/server/state/runs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.meta.project_id) {
    throw createError({ statusCode: 400, message: "missing project_id" });
  }

  const project = await getProject(event, body.meta.project_id);
  if (!project) {
    throw createError({ statusCode: 404, message: "project not found" });
  }

  const runId = crypto.randomUUID();
  body.project = project

  body.repo = {
    name: project.repo!,
    owner: process.env.GITHUB_OWNER!
  }

  if (!project.vercel_id) {

    const vProject = await vercel.projects.createProject({
      teamId: getVercelTeamId() as string,
      requestBody: {
        name: sanitizeVercelProjectName(body.repo.name!),
        framework: "nuxtjs",
        gitRepository: { type: "github", repo: `${body.repo.owner}/${body.repo.name}` },
      },
    });

    vercel.projects.updateProject;
    await updateProject(event, body.meta.project_id, { vercel_id: vProject.id });

    project.vercel_id = vProject.id;

  }

  body.vercelId = project.vercel_id;

  const githubRepo = await octokit.rest.repos.get({ owner: body.repo.owner!, repo: body.repo.name! });

  const deployment = await vercel.deployments.createDeployment({
    teamId: getVercelTeamId() as string,
    requestBody: {
      name: sanitizeVercelProjectName(body.repo.name!),
      project: body.vercelId,
      target: "staging",
      gitSource: { type: "github", repoId: githubRepo.data.id, ref: "main" },
    },
  });

  body.deploymentId = deployment.id;


  saveRun(runId, body);

  return { ok: true, runId, body };
});
