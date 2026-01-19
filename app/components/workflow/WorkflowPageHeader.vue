<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold">{{ title }}</h1>
            <p class="text-gray-500 dark:text-gray-400">{{ $t(subtitle) }}</p>
          </div>

          <div class="flex gap-2">
            <template v-for="(chip, index) in meta" :key="index">
              <UBadge
                v-if="getChipVisibility(chip)"
                :label="getChipText(chip)"
                :color="getChipTone(chip)"
                size="sm"
              />
            </template>
          </div>
        </div>
        <div class="flex gap-2">
          <template v-for="(action, index) in actions" :key="index">
            <UButton
              v-if="action.type === 'UButton'"
              :label="action.label"
              :variant="action.variant"
              :color="action.color"
              :icon="action.icon"
              :loading="getLoadingState(action)"
              @click="handleAction(action)"
            />
            <UDropdownMenu
              v-else-if="action.type === 'UDropdown'"
              size="sm"
              :items="action.items?.map((item) => ({ label: item.label, onSelect: () => handleAction(item) }))"
            >
              <UButton
                :label="action.label"
                :variant="action.variant || 'outline'"
                :color="action.color || 'neutral'"
                trailing-icon="i-heroicons-chevron-down-20-solid"
              />
            </UDropdownMenu>
          </template>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

type ValueSource<T> = T | (() => T)

interface ChipDefinition {
  type: string
  bindTo?: ValueSource<string | null>
  text?: string
  textFrom?: ValueSource<string>
  tone?: string
  toneFrom?: ValueSource<string>
  map?: { [key: string]: { text: string; tone: string } }
  visibleWhen?: { expr: boolean | (() => boolean) }
}

interface DropdownItem {
  label: string
  action?: string | Function
  click?: Function
  payload?: { typeFrom: string }
}

interface ActionDefinition {
  type: string
  label: string
  icon?: string
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'soft' | 'subtle'
  color?: 'neutral' | 'primary' | 'error' | 'success' | 'info' | 'warning' | 'secondary'
  loadingFrom?: ValueSource<boolean>
  action?: string | Function
  items?: DropdownItem[]
  payload?: { typeFrom: string }
}

const props = defineProps({
  title: { type: String, default: undefined },
  titleFrom: { type: [String, Function] as PropType<ValueSource<string>>, default: undefined },
  subtitle: { type: String, required: true },
  meta: { type: Array as PropType<ChipDefinition[]>, default: () => [] },
  actions: { type: Array as PropType<ActionDefinition[]>, default: () => [] }
})

const resolveValue = <T,>(source: ValueSource<T> | undefined, fallback: T) => {
  if (typeof source === 'function') {
    return source()
  }
  return source ?? fallback
}

const title = computed(() => resolveValue(props.title ?? props.titleFrom, 'Untitled'))

const getChipText = (chip: ChipDefinition) => {
  if (chip.text) {
    return chip.text
  }
  const current = resolveValue(chip.textFrom ?? chip.bindTo, '')
  if (chip.map && current in chip.map) {
    return chip.map[current].text
  }
  return current ?? ''
}

const getChipTone = (chip: ChipDefinition) => {
  if (chip.tone) {
    return chip.tone
  }
  const current = resolveValue(chip.toneFrom ?? chip.bindTo, 'neutral')
  if (chip.map && current in chip.map) {
    return chip.map[current].tone
  }
  return current ?? 'neutral'
}

const getChipVisibility = (chip: ChipDefinition) => {
  if (!chip?.visibleWhen) {
    return true
  }
  const expr = chip.visibleWhen.expr
  if (typeof expr === 'function') {
    return !!expr()
  }
  return !!expr
}

const getLoadingState = (action: ActionDefinition) => {
  if (!action.loadingFrom) return false
  return !!resolveValue(action.loadingFrom, false)
}

const handleAction = (action: DropdownItem | ActionDefinition) => {
  if (typeof action.click === 'function') {
    action.click()
    return
  }
  if (typeof action.action === 'function') {
    action.action()
  }
}
</script>

<style scoped></style>
