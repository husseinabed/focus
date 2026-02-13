import { deleteProjectData } from '~~/server/utils/projectsStore'

export default defineEventHandler(async (event) => {
  const dataId = getRouterParam(event, 'dataId')

  if (!dataId) {
    throw createError({ statusCode: 400, message: 'Data ID is required' })
  }

  return deleteProjectData(event, dataId)
})
