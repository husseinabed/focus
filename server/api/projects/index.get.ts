import { listProjects } from '~~/server/utils/projectsStore'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  return await listProjects(event, {
    q: query.q as string,
    status: query.status as string,
    has_repo: query.has_repo !== undefined ? String(query.has_repo) === 'true' : undefined,
    has_vercel: query.has_vercel !== undefined ? String(query.has_vercel) === 'true' : undefined,
    sort: query.sort as string,
    page: Number(query.page),
    pageSize: Number(query.pageSize)
  })
})
