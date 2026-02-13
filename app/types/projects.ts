export interface Project {
  id: string
  workspace_id: string
  name: string
  slug: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  repo: string | null
  vercel_id: string | null
  last_preview_url: string | null
  created_at: string
  updated_at: string
}
export interface ProjectData {
  id: string
  workspace_id: string
  project_id: string
  key: string
  data: object
  created_at: string
  updated_at: string
}