<template>
  <div class="flex flex-col flex-1 overflow-y-auto p-4" ref="threadBodyRef">
    <div v-if="inboxStore.loadingMessages" class="text-center text-gray-500">
      Loading messages...
    </div>
    <div v-else-if="!inboxStore.currentConversation" class="flex flex-col items-center justify-center h-full text-gray-500">
      <h3 class="text-lg font-semibold">{{ $t("inbox.empty.thread.title") }}</h3>
      <p class="text-gray-500">{{ $t("inbox.empty.thread.subtitle") }}</p>
    </div>
    <div v-else class="flex flex-col gap-4">
      <div v-for="(messageGroup, index) in groupedMessages" :key="index" class="flex flex-col" :class="{'items-end': messageGroup.sender_type === 'agent', 'items-start': messageGroup.sender_type === 'lead'}">
        <div class="flex items-center gap-2" :class="{'flex-row-reverse': messageGroup.sender_type === 'agent'}">
          <UAvatar v-if="messageGroup.sender_type === 'lead'" :alt="inboxStore.currentConversation.lead.full_name || inboxStore.currentConversation.lead.company_name" size="sm" />
          <div class="flex flex-col gap-1">
            <div
              v-for="message in messageGroup.messages"
              :key="message.id"
              class="px-4 py-2 rounded-lg max-w-xs"
              :class="{
                'bg-primary-500 text-white': messageGroup.sender_type === 'agent',
                'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100': messageGroup.sender_type === 'lead',
              }"
            >
              {{ message.content }}
            </div>
          </div>
          <UTooltip :text="formatDateTime(messageGroup.timestamp)">
            <span class="text-xs text-gray-500">{{ formatTime(messageGroup.timestamp) }}</span>
          </UTooltip>
        </div>
        <div v-if="messageGroup.sender_type === 'agent'" class="text-xs text-gray-500 mt-1 mr-2">
          <template v-if="messageGroup.messages[messageGroup.messages.length - 1]?.status === 'queued'">
            <UIcon name="i-heroicons-clock" /> Queued
          </template>
          <template v-else-if="messageGroup.messages[messageGroup.messages.length - 1]?.status === 'sent'">
            <UIcon name="i-heroicons-check" /> Sent
          </template>
          <template v-else-if="messageGroup.messages[messageGroup.messages.length - 1]?.status === 'delivered'">
            <UIcon name="i-heroicons-check-double" /> Delivered
          </template>
          <template v-else-if="messageGroup.messages[messageGroup.messages.length - 1]?.status === 'read'">
            <UIcon name="i-heroicons-eye" /> Read
          </template>
          <template v-else-if="messageGroup.messages[messageGroup.messages.length - 1]?.status === 'failed'">
            <UIcon name="i-heroicons-exclamation-circle" /> Failed
          </template>
        </div>
      </div>

      <!-- System Events -->
      <div v-if="inboxStore.currentConversation.needs_approval" class="text-center text-gray-500 italic text-sm">
        <p class="mt-2">Approval requested</p>
      </div>
      <!-- Add other system events as needed -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInboxStore } from "~/stores/inbox";
import type { Message } from "~/types/inbox";

const inboxStore = useInboxStore();
const threadBodyRef = ref<HTMLElement | null>(null);

interface MessageGroup {
  sender_type: Message["sender_type"];
  timestamp: string;
  messages: Message[];
}

const groupedMessages = computed<MessageGroup[]>(() => {
  if (!inboxStore.currentConversation) return [];
  const messages = inboxStore.conversationMessages(inboxStore.currentConversation.id);

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    if (!currentGroup || currentGroup.sender_type !== message.sender_type || (new Date(message.created_at).getTime() - new Date(currentGroup.timestamp).getTime() > 120000)) {
      // Start a new group if sender changes, or if more than 2 minutes passed
      currentGroup = {
        sender_type: message.sender_type,
        timestamp: message.created_at,
        messages: [message],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
      currentGroup.timestamp = message.created_at; // Update timestamp to the latest message in the group
    }
  }
  return groups;
});

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

watch(() => inboxStore.currentConversation, () => {
  // Scroll to bottom when conversation changes or messages load
  nextTick(() => {
    if (threadBodyRef.value) {
      threadBodyRef.value.scrollTop = threadBodyRef.value.scrollHeight;
    }
  });
}, { immediate: true });

watch(() => inboxStore.messagesByConversationId[inboxStore.currentConversation?.id || ''], () => {
  nextTick(() => {
    if (threadBodyRef.value) {
      threadBodyRef.value.scrollTop = threadBodyRef.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
/* Add any specific styles for ThreadBody here */
</style>
