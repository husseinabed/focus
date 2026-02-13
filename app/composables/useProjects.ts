import type { Project } from '~/types/projects'

export const useProjects = () => {
  const listProjects = async (params?: any) => {
    return await $fetch<Project[]>('/api/projects', {
      params
    })
  }

  const getProject = async (id: string) => {
    return await $fetch<Project>(`/api/projects/${id}`)
  }

  const createProject = async (data: Partial<Project>) => {
    return await $fetch<Project>('/api/projects', {
      method: 'POST',
      body: data
    })
  }

  const updateProject = async (id: string, data: Partial<Project>) => {
    return await $fetch<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: data
    })
  }

  const deleteProject = async (id: string) => {
    return await $fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    })
  }

  const duplicateProject = async (id: string) => {
    return await $fetch<Project>(`/api/projects/${id}/duplicate`, {
      method: 'POST'
    })
  }

  const toggleArchive = async (id: string) => {
    return await $fetch<Project>(`/api/projects/${id}/toggle-archive`, {
      method: 'POST'
    })
  }

  return {
    listProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    toggleArchive
  }
}
