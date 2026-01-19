<!-- app/components/workflow/RunConsoleDock.vue -->
<script setup lang="ts">
type ConsoleEntry = {
  id: string
  type: 'started' | 'ping' | 'node' | 'finished' | 'error'
  ts: string
  nodeId?: string
  nodeType?: string
  status?: 'start' | 'success' | 'fail'
  message?: string
  output?: any
  payload?: any
}

const props = withDefaults(
  defineProps<{
    active?: boolean
    running?: boolean
    open?: boolean
    height?: number
    items?: ConsoleEntry[]
  }>(),
  {
    active: true,
    running: false,
    open: true,
    height: 260,
    items: () => [],
  }
)

const emit = defineEmits<{
  (e: 'clear'): void
  (e: 'open-change', value: boolean): void
  (e: 'height-change', value: number): void
  (e: 'go-runs'): void
}>()

const toggleOpen = () => emit('open-change', !props.open)

const setHeight = (val: number) => emit('height-change', val)

const badgeColor = (item: ConsoleEntry) => {
  if (item.type === 'error') return 'error'
  if (item.type === 'finished') return 'success'
  if (item.type === 'node') {
    if (item.status === 'fail') return 'error'
    if (item.status === 'success') return 'success'
    return 'warning'
  }
  return 'neutral'
}
</script>

<template>
  <div v-if="active" class="fixed inset-x-0 bottom-0 z-50">

    <div class="mx-auto max-w-[1600px] px-4 pb-4">
      <UCard
        class="rounded-t-2xl border border-muted shadow-lg"
        :ui="{ header: 'p-3 sm:px-4 sm:py-3', body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <UIcon name="i-lucide-terminal" class="flex-shrink-0" />
              <span class="font-semibold truncate">Run Console</span>

              <UBadge
                :label="running ? 'Running…' : 'Idle'"
                color="neutral"
                variant="subtle"
                size="xs"
                class="flex-shrink-0"
              />

              <UBadge
                v-if="items?.length"
                :label="String(items.length)"
                color="neutral"
                variant="soft"
                size="xs"
                class="flex-shrink-0"
              />
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <UButton
                label="Clear"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                @click="emit('clear')"
              />

              <UButton
                label="Runs"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-square-arrow-out-up-right"
                @click="emit('go-runs')"
              />

              <UButton
                :label="open ? 'Collapse' : 'Expand'"
                size="xs"
                color="neutral"
                variant="soft"
                :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                @click="toggleOpen"
              />
            </div>
          </div>
        </template>

        <div v-if="open">
          <div
            class="flex items-center justify-between px-3 py-2 border-t border-muted bg-white/60 dark:bg-gray-900/40 backdrop-blur"
          >
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Live node execution events
            </div>

            <div class="flex items-center gap-2">
              <UButton label="S" size="xs" color="neutral" variant="ghost" @click="setHeight(220)" />
              <UButton label="M" size="xs" color="neutral" variant="ghost" @click="setHeight(320)" />
              <UButton label="L" size="xs" color="neutral" variant="ghost" @click="setHeight(420)" />
            </div>
          </div>

          <div
            class="overflow-auto font-mono text-xs px-3 py-3 space-y-2"
            :style="{ height: height + 'px' }"
          >   
            <div v-for="item in items" :key="item.id" class="border-b border-muted pb-2">
              <div class="flex items-center gap-2 flex-wrap">
                <UBadge
                  :label="item.type"
                  :color="badgeColor(item)"
                  variant="subtle"
                  size="xs"
                />
                <span class="text-gray-500">{{ item.ts }}</span>

                <span v-if="item.nodeType" class="font-semibold">
                  {{ item.nodeType }}
                </span>

                <span v-if="item.nodeId" class="text-gray-500">
                  ({{ item.nodeId }})
                </span>

                <span v-if="item.status" class="text-gray-700 dark:text-gray-200">
                  — {{ item.status }}
                </span>
              </div>

              <div v-if="item.message" class="mt-1">
                {{ item.message }}
              </div>

              <pre
                v-if="item.output !== undefined"
                class="mt-1 whitespace-pre-wrap text-[11px] leading-snug"
              >{{ JSON.stringify(item.output, null, 2) }}</pre>

              <pre
                v-else-if="item.payload && item.type !== 'ping'"
                class="mt-1 whitespace-pre-wrap text-[11px] leading-snug text-gray-500 dark:text-gray-400"
              >{{ JSON.stringify(item.payload, null, 2) }}</pre>
            </div>

            <div v-if="items.length === 0" class="text-gray-500">
              No events yet.
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
