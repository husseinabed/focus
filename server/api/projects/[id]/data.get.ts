import { getProjectData } from "~~/server/utils/projectsStore"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const projectData = await getProjectData(event, id)
  return { data: projectData }
})
