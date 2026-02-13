import { Project } from "~/types/projects";
import { streamDeploymentEvents } from "../utils/streamDeploymentEvents";
import { debugAgent } from "../agent/debug";
import { runDev } from "./runDev";



class DevLoop {
    private deploymentEvents: any[] = [];

    private event: any;
    private projectId: string;
    private project?: Project | null;
    private vercelId: string;
    private repo: { name: string; owner: string };
    private onEvent?: (data: any) => void;

    constructor(event: any, projectId: string) {

        this.project = null
        this.repo = { name: "", owner: "" }
        this.vercelId = ""
        this.event = event
        this.projectId = projectId

    }

    private async init() {

        this.project = await getProject(this.event, this.projectId) as Project;
        this.vercelId = this.project.vercel_id as string;
        this.repo = {
            name: this.project.repo!,
            owner: process.env.GITHUB_OWNER!
        }

    }


    async run(input: any, onEvent?: (data: any) => void) {
        this.onEvent = onEvent
        this.onEvent?.({ status: "init", message: "Starting init..." })

        try {
            await this.init()
        } catch (error: any) {
            this.onEvent?.({ status: "error", message: error.message, code: error.code });
            return
        }

        this.onEvent?.({ status: "init_completed", message: "Init completed", payload: { vercelId: this.vercelId, repo: this.repo } })

        this.onEvent?.({ status: "task", message: "Starting task...", payload: input })
        await this.deploy()

        const debug = await this.debug()
        this.onEvent?.({ status: "debug", message: "Debug completed...", payload: debug })
        this.onEvent?.({ status: "fix_build_errors", message: "Fixing build errors..."})
        await this.fixError(debug)

    }

    private async deploy() {

        this.onEvent?.({ status: "deploy", message: "Starting deployment..." })
        // create a vercel project if not created yet
        if (!this.vercelId) {

            this.onEvent?.({ status: "creating_vercel_project", message: "Creating `Vercel` project..." })

            const vProject = await vercel.projects.createProject({
                teamId: getVercelTeamId() as string,
                requestBody: {
                    name: sanitizeVercelProjectName(this.repo.name!),
                    framework: "nuxtjs",
                    gitRepository: { type: "github", repo: `${this.repo.owner}/${this.repo.name}` },
                },
            });
            this.vercelId = vProject.id;
            this.onEvent?.({ status: "creating_vercel_project_completed", message: "Creating `Vercel` project completed", payload: { vercelId: this.vercelId } })

            await updateProject(this.event, this.projectId, { vercel_id: this.vercelId });

            this.onEvent?.({ status: "vercel_id_updated", message: "Vercel ID updated", payload: { vercelId: this.vercelId } })

        }


        //deployment
        this.onEvent?.({ status: "creating_deployment", message: "Creating deployment..." })

        const githubRepo = await octokit.rest.repos.get({ owner: this.repo.owner!, repo: this.repo.name! });

        const deployment = await vercel.deployments.createDeployment({
            teamId: getVercelTeamId() as string,
            requestBody: {
                name: sanitizeVercelProjectName(this.repo.name!),
                project: this.vercelId,
                target: "staging",
                gitSource: { type: "github", repoId: githubRepo.data.id, ref: "main" },
            },
        });

        this.onEvent?.({ status: "deployment_created", message: "Deployment created", payload: { deploymentId: deployment.id } })


        this.onEvent?.({ status: "streaming_deployment_events", message: "Streaming deployment events..." })
        this.deploymentEvents = []

        await streamDeploymentEvents({
            deploymentId: deployment.id,
            teamId: getVercelTeamId() as string,
            token: process.env.VERCEL_TOKEN as string,
            onEvent: (event) => {

                this.deploymentEvents.push(event)

                this.onEvent?.({ status: "deployment_event", message: "Deployment event", payload: event })
                if (event.type === "ready") {
                    this.onEvent?.({ status: "deployment_ready", message: "Deployment ready" })
                }
                if (event.type === "error") {
                    this.onEvent?.({ status: "deployment_error", message: "Deployment error", payload: event })
                }
                if (event.type === "canceled") {
                    this.onEvent?.({ status: "deployment_canceled", message: "Deployment canceled", payload: event })
                }
                if (event.type === "fatal") {
                    this.onEvent?.({ status: "deployment_fatal", message: "Deployment fatal", payload: event })
                }
                if (event.type === "exit") {
                    this.onEvent?.({ status: "deployment_exit", message: "Deployment exit", payload: event })
                }
            },
        })

        this.onEvent?.({ status: "deployment_stream_closed", message: "Deployment stream closed", payload: { events: this.deploymentEvents } })





    }

    private async debug() {
        return await debugAgent.run(this.deploymentEvents, evt => this.onEvent?.({ status: "debug", message: "Starting debug...", payload: evt }))
    }

    private async fixError(debug: any) {
        return await runDev({
            task: "Fix all the errors",
            context: {
                debug
            },
            repo: this.repo,
            onEvent: this.onEvent
        })

    }

}



export const createDevLoop = (event: any, projectId: string) => new DevLoop(event, projectId)
