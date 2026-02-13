// ~/server/api/ai//stream.get.ts
import { stream } from "~~/server/utils/stream";
import { getRun, deleteRun, cleanupRuns } from "~~/server/state/runs";
import { getProjectDataByKey, setProjectDataByKey } from "~~/server/utils/projectsStore";
import { streamDeploymentEvents } from "~~/server/ai/utils/streamDeploymentEvents";



export default defineEventHandler((event) =>
  stream(event, async ({ send }) => {
    const { runId } = getQuery(event);
    if (!runId || typeof runId !== "string") {
      send({ type: "error", message: "missing runId" });
      return;
    }

    const run = getRun(runId);
    if (!run) {
      send({ type: "error", message: "run not found" });
      return;
    }

    send({ type: "status", message: "started", payload: run.body });



    await streamDeploymentEvents({
      deploymentId: run.body.deploymentId,
      teamId: getVercelTeamId() as string,
      token: process.env.VERCEL_TOKEN as string,
      onEvent: (event) => {
        send({ status: "deployment_event", message: "Deployment event", payload: event })
      },
    })


    send({ type: "status", message: "completed", payload: run });


    deleteRun(runId);
    cleanupRuns();


  })
);
