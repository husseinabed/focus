export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const project = await getProject(event, id)
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }

  return project
})
