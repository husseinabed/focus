<script setup lang="ts">
import type { Project } from '~/types/projects'

definePageMeta({
  layout: 'app'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getProject, updateProject } = useProjects()

const projectId = route.params.id as string

const { data: project, status, error } = await useAsyncData(
  `project-${projectId}`,
  () => getProject(projectId)
)

if (error.value) {
  console.error(error.value)
}

const handleSubmit = async (data: Partial<Project>) => {
  try {
    await updateProject(projectId, data)
    toast.add({ title: 'Project updated', color: 'success' })
    router.push(`/app/projects/${projectId}`)
  } catch (error) {
    toast.add({ title: 'Error updating project', color: 'error' })
  }
}

const handleCancel = () => {
  router.push(`/app/projects/${projectId}`)
}
</script>

<template>
  <div v-if="project" class="flex flex-col gap-4 p-4">
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <NuxtLink to="/app/projects" class="hover:text-gray-900">Projects</NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
        <NuxtLink :to="`/app/projects/${projectId}`" class="hover:text-gray-900">{{ project.name }}</NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
        <span>Edit</span>
      </div>
      <h1 class="text-2xl font-bold">Edit Project</h1>
    </div>

    <UCard>
      <ProjectForm
        :model-value="project"
        mode="edit"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </UCard>
  </div>
  <div v-else-if="status === 'pending'" class="flex items-center justify-center h-64">
    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
  </div>
  <div v-else class="p-4">
     <UAlert title="Project not found" color="error" variant="subtle" icon="i-lucide-alert-circle" />
     <UButton to="/app/projects" label="Go back to Projects" class="mt-4" color="neutral" variant="outline" />
  </div>
</template>
