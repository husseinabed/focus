<template>
  <div v-if="inboxStore.currentConversation" class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center gap-3">
      <UAvatar :alt="inboxStore.currentConversation.lead.full_name || inboxStore.currentConversation.lead.company_name" />
      <div>
        <p class="font-semibold">{{ inboxStore.currentConversation.lead.full_name || inboxStore.currentConversation.lead.company_name }}</p>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UBadge :label="inboxStore.currentConversation.lead.status" size="xs" />
          <UBadge :label="inboxStore.currentConversation.lead.language" size="xs" />
          <span>{{ timeAgo(inboxStore.currentConversation.last_message_at) }}</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <UButton
        icon="i-heroicons-adjustments-horizontal"
        variant="ghost"
        color="neutral"
        @click="inboxStore.toggleInspector()"
      />
      <UButton
        icon="i-heroicons-user"
        variant="ghost"
        color="neutral"
        :to="`/app/leads/${inboxStore.currentConversation.lead_id}`"
      />
      <UButton
        icon="i-heroicons-calendar-days"
        variant="soft"
        color="neutral"
        :to="`/app/meetings/new?lead=${inboxStore.currentConversation.lead_id}&type=proposal`"
      />
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-gray-500">
    {{ $t("inbox.empty.thread.title") }}
  </div>
</template>

<script setup lang="ts">
 
import { useInboxStore } from "~/stores/inbox";

const inboxStore = useInboxStore();

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};
</script>
