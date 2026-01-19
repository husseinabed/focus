<script setup lang="ts">
import ApprovalFilters from "~/components/approvals/ApprovalFilters.vue";
import ApprovalPreview from "~/components/approvals/ApprovalPreview.vue";
import ApprovalsList from "~/components/approvals/ApprovalsList.vue";
definePageMeta({
  layout: "app",
  title: "approvals.title",
});

const route = useRoute();
const { isMobile } = useDevice();

const selectedApproval = ref(null);
const isPreviewOpen = computed(() => !!selectedApproval.value);

function onSelectApproval(approval: any) {
  selectedApproval.value = approval;
}

function onClosePreview() {
  selectedApproval.value = null;
}
</script>

<template>
  <UMain class="min-h-screen">
    <div class="flex" :class="{ 'h-screen': isMobile }">
      <!-- Desktop Layout -->
      <template v-if="!isMobile">
        <UCard
          class="flex-none w-72 max-w-sm overflow-y-auto hidden md:flex"
          :ui="{ body: {} }"
        >
          <ApprovalFilters />
        </UCard>

        <USeparator orientation="vertical" />

        <div class="flex-1 overflow-y-auto">
          <ApprovalsList @select-approval="onSelectApproval" />
        </div>

        <USeparator orientation="vertical" />

        <UCard
          v-if="selectedApproval"
          class="flex-none w-96 max-w-md overflow-y-auto hidden lg:flex"
          :ui="{ body: {} }"
        >
          <ApprovalPreview :approval="selectedApproval" @close="onClosePreview" />
        </UCard>
      </template>

      <!-- Mobile Layout -->
      <template v-else>
        <div v-if="!isPreviewOpen" class="flex-1 flex flex-col">
          <div class="flex-none p-4">
            <ApprovalFilters />
          </div>
          <div class="flex-1 overflow-y-auto">
            <ApprovalsList @select-approval="onSelectApproval" />
          </div>
        </div>

        <UModal v-model="isPreviewOpen" fullscreen>
          <UCard
            v-if="selectedApproval"
            class="flex flex-col flex-1"
            :ui="{ body: {}, divide: 'divide-y divide-gray-100 dark:divide-gray-800' }"
          >
            <ApprovalPreview :approval="selectedApproval" @close="onClosePreview" />
          </UCard>
        </UModal>
      </template>
    </div>
  </UMain>
</template>
