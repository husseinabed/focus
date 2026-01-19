<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { FlowNode, NodeSchema, NodePort, StringI18n } from '~~/app/types/workflow_editor'
import { useI18n } from 'vue-i18n'
import { getTranslation } from '~~/app/utils/workflow'

const props = defineProps<{
  data: {
    schema: NodeSchema
    label?: string
    execution?: Record<string, any>
    runtimePorts?: {
      inputs: NodePort[]
      outputs: NodePort[]
    }
  }
  selected?: boolean
}>()

const { locale } = useI18n()

const currentNodeSchema = computed(() => props.data.schema)

const nodeTitle = computed(() => getTranslation(currentNodeSchema.value.title, locale.value))
const nodeHint = computed(() => getTranslation(currentNodeSchema.value.hint as StringI18n, locale.value))

const inputPorts = computed(() => props.data.runtimePorts?.inputs || props.data.schema.ports.inputs)
const outputPorts = computed(() => props.data.runtimePorts?.outputs || props.data.schema.ports.outputs)

// Determine if the layout should be RTL
const isRTL = computed(() => locale.value === 'he' || locale.value === 'ar')

const nodeClass = computed(() => ({
  'border-primary-500 ring-primary-500': props.selected,
  'border-gray-300 dark:border-gray-700': !props.selected,
  'flex-row-reverse': isRTL.value, // Apply RTL if locale is Hebrew or Arabic
}))
</script>

<template>
  <UCard
    :ui="{
      body: 'p-2 sm:p-3',
      header: 'p-2 sm:px-3 sm:py-3',
      footer: 'p-2 sm:p-3',
    }"
    class="w-full"
    :class="nodeClass"
  >
    <template #header>
      <div class="flex items-center gap-2" :class="{ 'flex-row-reverse': isRTL }">
        <UIcon :name="currentNodeSchema.icon" class="flex-shrink-0" />
        <span class="font-semibold text-sm truncate">{{ nodeTitle }}</span>
      </div>
    </template>

    <div v-if="nodeHint" class="text-xs text-gray-500 dark:text-gray-400 mb-2" :class="{ 'text-right': isRTL }">
      {{ nodeHint }}
    </div>

    <div class="flex flex-col gap-1">
      <div v-if="data.execution?.requiresApproval">
        <UBadge color="warning" variant="subtle" size="xs" class="w-full" :class="{ 'text-right': isRTL }">
          {{ isRTL ? 'דורש אישור' : 'Requires Approval' }}
        </UBadge>
      </div>
      <div v-if="data.execution?.blocking">
        <UBadge color="error" variant="subtle" size="xs" class="w-full" :class="{ 'text-right': isRTL }">
          {{ isRTL ? 'חוסם' : 'Blocking' }}
        </UBadge>
      </div>
    </div>

    <div
      class="node-ports mt-2 flex justify-between gap-4"
      :class="{ 'flex-row-reverse': isRTL }"
    >
      <div class="input-ports flex flex-col gap-2 items-start" :class="{ 'items-end': isRTL }">
        <div v-for="port in inputPorts" :key="port.id" class="relative flex items-center">
          <Handle
            :id="port.id"
            type="target"
            :position="isRTL ? Position.Right : Position.Left"
            class="!h-2 !w-2 !-left-1 !bg-gray-400 dark:!bg-gray-600"
            :class="{
              '!right-auto !-left-1': !isRTL, // LTR: Left side
              '!left-auto !-right-1': isRTL, // RTL: Right side
            }"
          />
          <span class="text-xs text-gray-600 dark:text-gray-300 ml-2" :class="{ 'mr-2 ml-0 text-right': isRTL }">
            {{ getTranslation(port.label || { en: port.id }, locale) }}
          </span>
        </div>
      </div>

      <div class="output-ports flex flex-col gap-2 items-end" :class="{ 'items-start': isRTL }">
        <div v-for="port in outputPorts" :key="port.id" class="relative flex items-center">
          <Handle
            :id="port.id"
            type="source"
            :position="isRTL ? Position.Left : Position.Right"
            class="!h-2 !w-2 !-right-1 !bg-gray-400 dark:!bg-gray-600"
            :class="{
              '!left-auto !-right-1': !isRTL, // LTR: Right side
              '!right-auto !-left-1': isRTL, // RTL: Left side
            }"
          />
          <span class="text-xs text-gray-600 dark:text-gray-300 mr-2" :class="{ 'ml-2 mr-0 text-left': isRTL }">
            {{ getTranslation(port.label || { en: port.id }, locale) }}
          </span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
/* Add any specific styles here if needed */
</style>
