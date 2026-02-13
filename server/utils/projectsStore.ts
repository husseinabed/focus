import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import type { Project, ProjectData } from '~/types/projects'
import { resolveWorkspaceId } from './workspace'

interface ListProjectsQuery {
  q?: string
  status?: string
  has_repo?: boolean
  has_vercel?: boolean
  sort?: string
  page?: number
  pageSize?: number
}

export const listProjects = async (event: H3Event, query: ListProjectsQuery) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const workspaceId = await resolveWorkspaceId(client, user as any)

  // 1. Fetch counts (global for workspace)
  const { data: statusCounts, error: countError } = await client
    .from('projects')
    .select('status, count', { count: 'exact', head: false }) // Assuming we can use count with group by, but Supabase JS select is tricky with group by.
  // Actually simpler to just fetch all id, status for the workspace if dataset is small, OR use rpc.
  // Given the constraints, let's run separate count queries or one query for all statuses if we can.
  // Supabase .select doesn't support GROUP BY directly in the JS client easily without rpc or view.
  // Let's use parallel count queries for simplicity as suggested.

  // Actually, we can just do one count query for total, and if we need status specific, maybe we can accept 3 parallel queries.
  // But wait, the user said "parallel queries are fine for now".

  // Let's do parallel queries for the stats.
  const countPromise = (status?: string) => {
    let q = client.from('projects').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId)
    if (status) q = q.eq('status', status)
    return q
  }

  const [totalRes, activeRes, draftRes, archivedRes] = await Promise.all([
    countPromise(),
    countPromise('active'),
    countPromise('draft'),
    countPromise('archived')
  ])

  const counts = {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    draft: draftRes.count || 0,
    archived: archivedRes.count || 0
  }

  // 2. Fetch data (filtered)
  let dbQuery = client
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)

  if (query.q) {
    // ILIKE for case insensitive search
    // We want (name ilike %q% OR description ilike %q% OR slug ilike %q% OR repo ilike %q%)
    // Supabase syntax: .or(`name.ilike.%${q}%,description.ilike.%${q}%...`)
    const q = `%${query.q}%`
    dbQuery = dbQuery.or(`name.ilike.${q},description.ilike.${q},slug.ilike.${q},repo.ilike.${q}`)
  }

  if (query.status && query.status !== 'any') {
    dbQuery = dbQuery.eq('status', query.status)
  }

  if (query.has_repo !== undefined) {
    const hasRepo = String(query.has_repo) === 'true'
    if (hasRepo) {
      dbQuery = dbQuery.not('repo', 'is', null)
    } else {
      dbQuery = dbQuery.is('repo', null)
    }
  }

  if (query.has_vercel !== undefined) {
    const hasVercel = String(query.has_vercel) === 'true'
    if (hasVercel) {
      dbQuery = dbQuery.not('vercel_id', 'is', null)
    } else {
      dbQuery = dbQuery.is('vercel_id', null)
    }
  }

  // Sorting
  const sortParam = query.sort || 'updated_at desc'
  const [sortField, sortDir] = sortParam.split(' ')
  dbQuery = dbQuery.order(sortField, { ascending: sortDir !== 'desc' })

  // Pagination
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  dbQuery = dbQuery.range(from, to)

  const { data, count, error } = await dbQuery

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return {
    data: data as Project[],
    count: count || 0,
    counts
  }
}

export const getProject = async (event: H3Event, id: string) => {
  const client = await serverSupabaseClient(event)
  // We should ideally check workspace ownership here too via RLS, but explicit check is good.
  // RLS policies "Allow workspace members to view projects" already enforces checking workspace_members.
  // So we just need to query by ID.
  // However, we still need to know if the user is authorized implicitly by RLS.

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null // Or throw? The original returned undefined/null if not found.

  return data as Project
}

export const getProjectData = async (event: H3Event, id: string) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('project_data')
    .select('id, workspace_id, project_id, key, data, created_at, updated_at')
    .eq('project_id', id)

  if (error) return null

  return data as ProjectData[]
}
export const getProjectDataByKey = async (event: H3Event, id: string, key: string, onEmpty?: () => any) => {
  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('project_data')
    .select('data')
    .eq('project_id', id).eq('key', key)
    .single()

   if (!data && error.code === 'PGRST116') return await onEmpty?.()
  if (error) return null
  
  
 

  return (data as any).data as any
}

export const setProjectDataByKey = async (
  event: H3Event,
  projectId: string,
  key: string,
  data: any
) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);
  if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

  const workspaceId = await resolveWorkspaceId(client, user as any);

  const payload = {
    workspace_id: workspaceId,
    project_id: projectId,
    key,
    data,
  };

  const { data: saved, error } = await client
    .from("project_data")
    .upsert(payload as any, {
      onConflict: "workspace_id,project_id,key",
      ignoreDuplicates: false,
    })
    .select()
    .single();
   console.log(error);
  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return saved as ProjectData;
};


export const createProjectData = async (event: H3Event, data: Partial<ProjectData>) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const workspaceId = await resolveWorkspaceId(client, user as any)

  const newProjectData = {
    workspace_id: workspaceId,
    project_id: data.project_id,
    key: data.key,
    data: data.data,
  }

  const { data: created, error } = await client
    .from('project_data')
    .insert(newProjectData as any)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return created as ProjectData
}

export const updateProjectData = async (event: H3Event, id: string, data: Partial<ProjectData>) => {
  const client = await serverSupabaseClient(event)

  const updateData: any = { ...data }
  delete updateData.id
  delete updateData.workspace_id
  delete updateData.project_id
  delete updateData.created_at
  delete updateData.updated_at

  const { data: updated, error } = await client
    .from('project_data')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return updated as ProjectData
}

export const deleteProjectData = async (event: H3Event, id: string) => {
  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('project_data')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return true
}





export const createProject = async (event: H3Event, data: Partial<Project>) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const workspaceId = await resolveWorkspaceId(client, user as any)

  // Check unique slug within workspace
  // Although the DB has a UNIQUE constraint on slug globally (based on the migration provided: "slug text NOT NULL UNIQUE").
  // Wait, the migration says `slug text NOT NULL UNIQUE`. This implies global uniqueness, not per workspace.
  // The original in-memory store checked `p.slug === data.slug && p.workspace_id === workspaceId`.
  // If the DB constraint is global, we might have issues if different workspaces want the same slug.
  // BUT, looking at the migration provided: `slug text NOT NULL UNIQUE`.
  // So we must handle 409 from DB or check beforehand.
  // Let's check beforehand to be nice.

  const { data: existing } = await client
    .from('projects')
    .select('id')
    .eq('slug', data.slug!)
    .maybeSingle()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Slug already exists' })
  }

  const newProject = {
    workspace_id: workspaceId,
    name: data.name!,
    slug: data.slug!,
    description: data.description || null,
    status: (data.status as Project['status']) || 'draft',
    repo: data.repo || null,
    vercel_id: data.vercel_id || null,
    // created_at/updated_at handled by DB/Trigger
  }

  const { data: created, error } = await client
    .from('projects')
    .insert(newProject as any)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw createError({ statusCode: 409, message: 'Slug already exists' })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  return created as Project
}

export const updateProject = async (event: H3Event, id: string, data: Partial<Project>) => {
  const client = await serverSupabaseClient(event)

  // RLS will handle permission checks.
  // But we might want to check slug uniqueness if changing slug.
  if (data.slug) {
    const { data: existing } = await client
      .from('projects')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      throw createError({ statusCode: 409, message: 'Slug already exists' })
    }
  }

  const updateData: any = { ...data }
  delete updateData.id
  delete updateData.workspace_id
  delete updateData.created_at
  delete updateData.updated_at // Trigger handles this usually, but we can rely on return.

  const { data: updated, error } = await client
    .from('projects')
    .update(updateData as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return updated as Project
}

export const deleteProject = async (event: H3Event, id: string) => {
  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return true
}

export const duplicateProject = async (event: H3Event, id: string) => {
  const original = await getProject(event, id)
  if (!original) throw createError({ statusCode: 404, message: 'Project not found' })

  // Generate new slug
  const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}` // Simplified randomness

  const newProjectData = {
    ...original,
    name: `Copy of ${original.name}`,
    slug: newSlug,
    status: 'draft' as const
  }

  // Use createProject to handle reuse logic
  return createProject(event, newProjectData)
}

export const toggleProjectArchive = async (event: H3Event, id: string) => {
  const project = await getProject(event, id)
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  const newStatus = project.status === 'archived' ? 'active' : 'archived'
  return updateProject(event, id, { status: newStatus })
}
