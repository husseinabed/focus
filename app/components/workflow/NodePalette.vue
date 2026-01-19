<script setup lang="ts">
import { computed } from 'vue'

type NodeEntry = {
  type: string
  title?: string
  icon?: string
}

const props = defineProps({
  groups: {
    type: Object as () => Record<string, NodeEntry[]>,
    required: true
  },
  search: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'drop-node', payload: { type: string }): void
}>()

const searchValue = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value)
})

const onDragStart = (event: DragEvent, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleAdd = (nodeType: string) => {
  emit('drop-node', { type: nodeType })
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold mb-2">Node Palette</h2>
      <UInput v-model="searchValue" placeholder="Search nodes..." class="w-full" />
    </div>
    <div class="space-y-5">
      <div v-for="(nodes, group) in groups" :key="group">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          {{ group }}
        </h3>
        <div v-if="nodes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No nodes found.
        </div>
        <div v-else class="grid grid-cols-1 gap-2">
       
          <UButton
            v-for="node in nodes"
            :key="node.type"
            :icon="node.icon"
            :label="$t(node.title as string) || node.type"
            color="neutral"
           
            variant="soft"
            block
            class="justify-start"
            draggable="true"
            @dragstart="onDragStart($event as DragEvent, node.type)"
            @click="handleAdd(node.type)"
          />
          
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styles for the node palette here */
</style>
