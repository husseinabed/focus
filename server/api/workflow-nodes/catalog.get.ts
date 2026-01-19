import { list } from "~~/shared/workflowNodeSchemas";

export default defineEventHandler(() => {
  return {
    items: list
  }
})
