<template>
  <div class="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">New Project</h1>
    </div>

    <UCard>
      <ProjectForm
        mode="create"
        :model-value="{}"
        @submit="save"
        @cancel="cancel"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/projects'
import ProjectForm from '~/components/projects/ProjectForm.vue'

definePageMeta({
  layout: 'app'
})

const toast = useToast()

async function save(data: Partial<Project>) {
  try {
    const res = await $fetch<{ item: Project }>('/api/projects', {
      method: 'POST',
      body: data
    })

    toast.add({
      title: 'Success',
      description: 'Project created successfully',
      color: 'success'
    })

    await navigateTo(`/app/projects/${res.item.id}`)
  } catch (error: any) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create project',
      color: 'error'
    })
  }
}

function cancel() {
  navigateTo('/app/projects')
}
</script>
