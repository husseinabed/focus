import { getApplyAgent } from "../agent/apply";
import { getInspectAgent } from "../agent/inspect";
import { getPlannerAgent } from "../agent/planner";

export const runDev = async ({ task, context, repo, onEvent }: { task: string; repo: { name: string; owner: string }; context: any, onEvent?: (data: any) => void }) => {
    onEvent?.({ status: "task", message: task })

    const applyAgent = await getApplyAgent()
    const plannerAgent = await getPlannerAgent()
    const inspectAgent = await getInspectAgent() 

    // ✅ retry inspect
    onEvent?.({ status: "inspection", message: "Starting inspection..." })

    const current_repo_tree = await inspectAgent.run({ task: "Give an overview of the repo", context, repo: repo }, onEvent)

    onEvent?.({ status: "inspection_completed", data: current_repo_tree })
 
    // ✅ retry plan
    onEvent?.({ status: "plan", message: "Starting plan..." })

    const plan = await plannerAgent.run({ task, context, repo: repo, current_repo_tree }, onEvent)

    onEvent?.({ status: "plan_completed", data: plan })

    onEvent?.({ status: "executing", message: "Starting execution..." })

    const getTask = (taskId: number) => plan.tasks.find((t: any) => t.id === taskId)
    const results: Record<string, any> = {}

    for (const t of plan.tasks) {
        onEvent?.({ status: "task", message: "Starting task ( " + t.id + " )...", task: t })

        const input = {
            meta: { context, repo },
            task: getTask(t.id),
            research_summary: plan.research_summary,
            stack_requirement: plan.stack_requirement,
            current_repo_tree,
        }

        // ✅ retry apply per task
        const output = await applyAgent.run(input, onEvent)

        onEvent?.({ status: "task_completed", data: { task: t, output } })
        results["task_" + t.id] = { task: t, output }
    }

    onEvent?.({ status: "dev_completed", data: results })
}