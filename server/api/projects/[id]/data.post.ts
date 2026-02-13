import { createProjectData } from '~~/server/utils/projectsStore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Project ID is required' })
  }

  return createProjectData(event, { ...body, project_id: id })
})
