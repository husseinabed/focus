<template>
  <div class="flex flex-col h-full">
    <!-- Desktop Layout (Grid) -->
    <div
      class="grid h-full w-full max-lg:hidden"
      :style="{
        gridTemplateColumns: layout.desktop.columns,
        gridTemplateRows: layout.desktop.rows,
        gridTemplateAreas: gridTemplateAreas,
      }"
    >
      <div class="list-header dark:bg-gray-950">
        <InboxConversationList />
      </div>
      <div class="thread-header dark:bg-gray-950">
        <InboxThreadHeader />
      </div>
      <div class="inspector-header dark:bg-gray-950">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 class="text-xl font-semibold">{{ $t("inbox.inspector.lead_details") }}</h3>
        </div>
      </div>

      <!-- <div class="list-body overflow-y-auto">
        <InboxConversationList />
      </div> -->
      <div class="thread-body overflow-y-auto">
        <InboxThreadBody />
      </div>
      <div class="inspector-body overflow-y-auto">
        <InboxInspector />
      </div>

      <div class="list-footer">
        <!-- Optional: Footer content for list column -->
      </div>
      <div class="thread-footer">
        <InboxComposer />
      </div>
      <div class="inspector-footer">
        <!-- Optional: Footer content for inspector column -->
      </div>
    </div>

    <!-- Mobile Layout (Stack) -->
    <div class="lg:hidden flex flex-col h-full">
      <div v-if="!inboxStore.currentConversation" class="flex-1">
        <InboxConversationList />
      </div>
      <div v-else class="flex flex-col flex-1">
        <InboxThreadHeader />
        <InboxThreadBody class="flex-1" />
        <InboxComposer />
        <USlideover v-model="inboxStore.inspectorOpen">
          <UCard class="flex flex-col flex-1" :ui="{ root: 'ring-0 divide-y divide-gray-100 dark:divide-gray-800', body: 'flex-1' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                  {{ $t("inbox.inspector.lead_details") }}
                </h3>
                <UButton
                  icon="i-heroicons-x-mark-20-solid"
                  color="neutral"
                  variant="ghost"
                  @click="inboxStore.toggleInspector()"
                />
              </div>
            </template>
            <InboxInspector />
          </UCard>
        </USlideover>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInboxStore } from "~/stores/inbox";

const inboxStore = useInboxStore();

definePageMeta({
  layout: "app",
});

const layout = {
  desktop: {
    columns: "340px minmax(520px,1fr) 360px",
    rows: "64px 1fr auto",
    areas: {
      row1: ["listHeader", "threadHeader", "inspectorHeader"],
      row2: ["listBody", "threadBody", "inspectorBody"],
      row3: ["listFooter", "threadFooter", "inspectorFooter"],
    },
    behavior: {
      thread_scroll: "only thread body scrolls",
      sticky_headers: true,
    },
  },
  mobile: {
    pattern: "stack",
    navigation: "left list becomes primary; thread opens as full screen route state; inspector is a slideover",
    inspector: "USlideover on demand",
  },
};

const gridTemplateAreas = computed(() => {
  const areas = layout.desktop.areas;
  return `\"${areas.row1.join(" ")}\" \"${areas.row2.join(" ")}\" \"${areas.row3.join(" ")}\"`;
});

onMounted(() => {
  inboxStore.fetchConversations();
});
</script>

<style scoped>
.list-header {
  grid-area: listHeader;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-white);
}
.thread-header {
  grid-area: threadHeader;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-white);
}
.inspector-header {
  grid-area: inspectorHeader;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-white);
}

.list-body {
  grid-area: listBody;
}
.thread-body {
  grid-area: threadBody;
}
.inspector-body {
  grid-area: inspectorBody;
}

.list-footer {
  grid-area: listFooter;
}
.thread-footer {
  grid-area: threadFooter;
}
.inspector-footer {
  grid-area: inspectorFooter;
}
</style>
