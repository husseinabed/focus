<template>
  <div v-if="inboxStore.currentConversation" class="p-4 border-t border-gray-200 dark:border-gray-800">
    <div v-if="inboxStore.currentConversation.needs_approval" class="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 p-2 text-sm rounded-lg mb-4 text-center sticky top-0">
      {{ $t("inbox.approval_banner_text") }}
    </div>

    <div class="flex items-center gap-2">
      <UTextarea
        v-model="draftMessage"
        placeholder="Type a message..."
        :rows="3"
        autoresize
        class="flex-1 w-full"
      />
      <UButton
        icon="i-heroicons-paper-clip"
        color="neutral"
        variant="ghost"
        class="aspect-square"
        square
      />
    </div>

    <div class="flex items-center justify-between mt-4">
      <UButton
        :label="$t('inbox.composer.templates')"
        icon="i-heroicons-document-text"
        variant="ghost"
        color="neutral"
      />
      <div class="flex items-center gap-2">
        <UButton
          :label="$t('inbox.composer.send_for_approval')"
          color="primary"
          variant="solid"
          :disabled="!draftMessage.trim()"
          @click="sendForApproval"
        />
        <UButton
          v-if="inboxStore.currentConversation.needs_approval"
          :label="$t('inbox.composer.approve_send')"
          color="success"
          variant="solid"
          :disabled="!draftMessage.trim()"
          @click="approveAndSend"
        />
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-gray-500">
    {{ $t("inbox.empty.thread.subtitle") }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useInboxStore } from "~/stores/inbox";

const inboxStore = useInboxStore();
const draftMessage = ref("");

const sendForApproval = () => {
  // Logic to send message for approval
  console.log("Sending for approval:", draftMessage.value);
  draftMessage.value = "";
};

const approveAndSend = () => {
  // Logic to approve and send message
  console.log("Approving and Sending:", draftMessage.value);
  draftMessage.value = "";
};
</script>
