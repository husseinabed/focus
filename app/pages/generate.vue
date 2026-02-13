<script lang="ts" setup>
definePageMeta({ layout: "default" })

const { t } = useI18n()
const route = useRoute()
const { runId, type } = route.query

const message = ref("")
const subMessage = ref("")
const runURL = ref("")

const phase = ref<"idle" | "running" | "done" | "error">("idle")

// keeps last few lines as a “live feed”
type LogItem = { ts: number; kind: "agent" | "tool" | "status" | "error"; text: string }
const logs = ref<LogItem[]>([])
const MAX_LOGS = 6

const pushLog = (kind: LogItem["kind"], text: string) => {
  const item = { ts: Date.now(), kind, text }
  logs.value = [item, ...logs.value].slice(0, MAX_LOGS)
}

const handleToolMessage = (data: any) => {
  switch (data.toolName) {
    case "browser_search":
      return (data.input?.queries || []).join(", ")
    case "browser_visit":
      return data.input?.url || ""
  }
  return ""
}

const { connect, disconnect } = useApiStream(runURL, {
  onEvent(evt) {
    const data = evt.data as any
    console.log(data);
    
    if (!data?.type) return

    if (data.type === "status") {
      // NOTE: your old code had a duplicated status check that could never trigger.
      // We'll treat status "completed" as "done".
      message.value = data?.message ?? ""
      if ((data?.message || "").toLowerCase().includes("completed")) {
        phase.value = "done"
        subMessage.value = ""
        pushLog("status", t("generate.status") + " " + (data?.message ?? ""))
        return
      }

      phase.value = "running"
      pushLog("status", data?.message ?? "")
      return
    }

    if (data.type === "error") {
      phase.value = "error"
      message.value = data?.message ?? ""
      subMessage.value = data?.details ?? ""
      pushLog("error", data?.message ?? "Error")
      return
    }

    if (typeof data.type === "string" && data.type.startsWith("agent_")) {
      phase.value = "running"
      const txt = t("generate.agents." + (data?.message ?? ""))
      message.value = txt
      pushLog("agent", txt)
      return
    }

    if (typeof data.type === "string" && data.type.startsWith("tool")) {
      phase.value = "running"
      const txt =
        t("generate." + (data?.toolName ?? "")) + " " + handleToolMessage(data)
      subMessage.value = txt
      pushLog("tool", txt)
      return
    }

    if (data?.message) {
      subMessage.value = data.message
      pushLog("status", data.message)
    }
  },
  onError(err) {
    phase.value = "error"
    pushLog("error", typeof err === "string" ? err : "Connection error")
    console.log(err)
  },
})

onMounted(() => {
  runURL.value = `/api/ai/run/stream?runId=${encodeURIComponent(
    String(runId || "")
  )}&type=${encodeURIComponent(String(type || ""))}`

  phase.value = "running"
  connect()
})

onBeforeUnmount(() => disconnect())

const phaseLabel = computed(() => {
  if (phase.value === "done") return t("generate.completed") || "Completed"
  if (phase.value === "error") return t("generate.error") || "Something went wrong"
  return t("generate.running") || "Generating"
})

const phaseDotClass = computed(() => {
  if (phase.value === "done") return "bg-emerald-500"
  if (phase.value === "error") return "bg-rose-500"
  return "bg-sky-500"
})

const kindBadge = (k: LogItem["kind"]) => {
  switch (k) {
    case "agent":
      return "Agent"
    case "tool":
      return "Tool"
    case "error":
      return "Error"
    default:
      return "Status"
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-950">
    <!-- subtle background blobs -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
      />
      <div
        class="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10"
      />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <div class="w-full">
        <!-- top status pill -->
        <div class="mb-6 flex items-center justify-between">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm text-gray-700 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-200"
          >
            <span class="relative flex h-2.5 w-2.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
                :class="phaseDotClass"
                v-if="phase === 'running'"
              />
              <span class="inline-flex h-2.5 w-2.5 rounded-full" :class="phaseDotClass" />
            </span>
            <span class="font-medium">{{ phaseLabel }}</span>
          </div>

          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ String(runId || "") ? `run: ${String(runId)}` : "" }}
          </div>
        </div>

        <!-- main card -->
        <div
          class="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/60"
        >
          <!-- header -->
          <div class="flex items-start gap-4">
            <!-- spinner / check / x -->
            <div
              class="grid h-12 w-12 place-items-center rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <div v-if="phase === 'running'" class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-white" />
              <svg v-else-if="phase === 'done'" viewBox="0 0 24 24" class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <svg v-else-if="phase === 'error'" viewBox="0 0 24 24" class="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <span v-else class="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                <span class="animate-fade-in">{{ message || (t("generate.preparing") || "Preparing…") }}</span>
              </div>

              <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span v-if="subMessage" class="shimmer">{{ subMessage }}</span>
                <span v-else class="text-gray-500/90 dark:text-gray-400">
                  {{ t("generate.wait") || "This usually takes a moment—streaming progress live." }}
                </span>
              </div>
            </div>
          </div>

          <!-- live feed -->
          <div class="mt-6">
            <div class="mb-2 flex items-center justify-between">
              <div class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ t("generate.liveFeed") || "Live feed" }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ logs.length ? `${logs.length} updates` : "" }}
              </div>
            </div>

            <div
              class="rounded-xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <div v-if="!logs.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {{ t("generate.noUpdatesYet") || "Waiting for updates…" }}
              </div>

              <ul v-else class="space-y-2">
                <li
                  v-for="l in logs"
                  :key="l.ts"
                  class="flex items-start gap-3 rounded-lg bg-white/70 px-3 py-2 shadow-sm ring-1 ring-gray-200/60 dark:bg-gray-900/50 dark:ring-gray-800"
                >
                  <span
                    class="mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    :class="{
                      'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300': l.kind === 'agent',
                      'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300': l.kind === 'tool',
                      'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300': l.kind === 'error',
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200': l.kind === 'status'
                    }"
                  >
                    {{ kindBadge(l.kind) }}
                  </span>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm text-gray-800 dark:text-gray-100">
                      {{ l.text }}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- footer actions -->
          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t("generate.tip") || "Tip: keep this tab open to avoid reconnecting." }}
            </div>

            <div class="flex items-center gap-2">
              <button
                class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                @click="disconnect()"
                v-if="phase === 'running'"
              >
                {{ t("generate.stop") || "Stop" }}
              </button>

              <button
                class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 active:scale-[0.99] dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
                @click="connect()"
                v-if="phase !== 'running'"
              >
                {{ t("generate.retry") || "Reconnect" }}
              </button>
            </div>
          </div>
        </div>

        <!-- tiny bottom note -->
        <div class="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
          {{ t("generate.footerNote") || "Streaming progress securely via SSE." }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* shimmer text */
.shimmer {
  background: linear-gradient(90deg, #8b8b8b 0%, #111 50%, #8b8b8b 100%);
  background-size: 200% auto;
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

/* small message fade */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 220ms ease-out;
}
</style>
