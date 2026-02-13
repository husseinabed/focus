import { getInspectAgent } from "~~/server/ai/agent/inspect";
import { getPlannerAgent } from "~~/server/ai/agent/planner";
import { getApplyAgent } from "~~/server/ai/agent/apply";










export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const applyAgent = await getApplyAgent();
  const plannerAgent = await getPlannerAgent();
  const inspectAgent = await getInspectAgent();


  console.log('[[ INSPECTION ]]');
  const current_repo_tree = await inspectAgent.run(body, (event) => console.log(event.type, event.toolName || event.name));
  console.log('[[ PLANING ]]');

  const plan = await plannerAgent.run({
    body,
    current_repo_tree
  }, (event) => console.log(event.type, event.toolName || event.name));

  console.log('[[ EXECUTING ]]');
  const getTask = (taskId: number) => plan.tasks.find((task: any) => task.id === taskId)
  const results: Record<string, any> = {}
  for (const task of plan.tasks) {
    console.log('[[ TASK ]]', task.id);

    const input = {
      meta: { ...body },
      task: getTask(task.id),
      research_summary: plan.research_summary,
      stack_requirement: plan.stack_requirement,
      current_repo_tree

    }
    const output = await applyAgent.run(input, event => console.log(event.type, event.toolName || event.name));
    results['task_' + task.id] = {
      task,
      output
    }

  }
  return results;
  // return await applyAgent.run({
  //   meta: {...body},
  //   task: getTask(body.taskId),
  //   research_summary: plan.research_summary,
  //   stack_requirement: plan.stack_requirement

  // }, (event) => console.log(event.type, event.toolName || event.name)); 
})

//