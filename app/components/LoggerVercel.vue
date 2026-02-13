<!-- components/LogViewer.vue -->
<script setup lang="ts">
import AnsiToHtml from "ansi-to-html";

type LogItem = {
  id?: string;
  serial?: string;
  date?: number;
  created?: number;
  text?: string;
  type?: "stdout" | "stderr" | string;
  level?: "info" | "warning" | "error" | string;
  info?: { type?: string; name?: string };
};

const props = withDefaults(
  defineProps<{
    items: LogItem[];
    height?: string;
    autoScroll?: boolean;
  }>(),
  {
    height: "480px",
    autoScroll: true,
  }
);

const wrap = ref<HTMLElement | null>(null);

/**
 * ANSI → HTML
 * tuned for LIGHT backgrounds
 */
const ansi = new AnsiToHtml({
  fg: "#111827",
  bg: "#ffffff",
  newline: true,
  escapeXML: true,
  colors: {
    0: "#000000",
    1: "#991b1b", // red
    2: "#166534", // green
    3: "#92400e", // yellow
    4: "#1d4ed8", // blue
    5: "#6b21a8",
    6: "#155e75",
    7: "#374151",
    8: "#6b7280",
  },
});

function ts(it: LogItem) {
  const ms = it.date ?? it.created;
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function render(it: LogItem) {
  if (!it.text) return "";
  return ansi.toHtml(it.text);
}

function scrollToBottom() {
  if (!wrap.value) return;
  wrap.value.scrollTop = wrap.value.scrollHeight;
}

watch(
  () => props.items.length,
  async () => {
    if (!props.autoScroll) return;
    await nextTick();
    scrollToBottom();
  },
  { immediate: true }
);
</script>

<template>
  <div class="log">
    <div ref="wrap" class="log__body" :style="{ height }">
      <div
        v-for="it in items"
        :key="it.id || it.serial"
        class="log__row"
        :data-level="it.level || it.type"
      >
        <span class="log__time">{{ ts(it) }}</span>

        <span class="log__stream">
          {{ (it.level || it.type || "log").toUpperCase() }}
        </span>

        <!-- ANSI rendered output -->
        <span class="log__text" v-html="render(it)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* container */
.log {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

/* scroll area */
.log__body {
  overflow: auto;
  padding: 10px 0;
}

/* rows */
.log__row {
  display: grid;
  grid-template-columns: 90px 90px 1fr;
  gap: 10px;
  padding: 6px 14px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
  line-height: 1.35;
}

@media (max-width: 900px) {
  .log__row {
    grid-template-columns: 1fr;
  }
}

/* time */
.log__time {
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* stdout / stderr */
.log__stream {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  width: fit-content;
}

.log__row[data-level="stderr"],
.log__row[data-level="error"] .log__stream {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.log__row[data-level="warning"] .log__stream {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

/* ansi output */
.log__text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
