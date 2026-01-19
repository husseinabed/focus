<template>
  <div class="flex flex-col h-full">
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">{{ $t("inbox.title") }}</h2>
        <div class="flex items-center gap-2">
          <UChip :text="inboxStore.filteredConversations.length" size="sm" color="primary" inset>
            <UButton icon="i-heroicons-arrow-path" color="neutral" variant="ghost" @click="inboxStore.fetchConversations()" />
          </UChip>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <UInput
          v-model="inboxStore.filters.q"
          :placeholder="$t('inbox.search')"
          icon="i-heroicons-magnifying-glass-20-solid"
          class="w-full"
          :debounce="250"
        />
      </div>

      <UFieldGroup class="w-full">
        <UButton
          v-for="state in conversationStates"
          :key="state.key"
          :label="state.label"
          :variant="inboxStore.filters.state === state.key ? 'solid' : 'ghost'"
          color="neutral"
          class="flex-1"
          @click="inboxStore.filters.state = state.key"
        />
      </UFieldGroup>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="inboxStore.loadingConversations" class="p-4 text-center text-gray-500">
        Loading conversations...
      </div>
      <div v-else-if="inboxStore.filteredConversations.length === 0" class="p-4 text-center">
        <div v-if="inboxStore.filters.q || inboxStore.filters.state !== 'open'">
          <h3 class="text-lg font-semibold">{{ $t("inbox.empty.search.title") }}</h3>
          <p class="text-gray-500">{{ $t("inbox.empty.search.subtitle") }}</p>
          <UButton @click="inboxStore.clearFilters()" class="mt-4">{{ $t("common.clear_filters") }}</UButton>
        </div>
        <div v-else>
          <h3 class="text-lg font-semibold">{{ $t("inbox.empty.list.title") }}</h3>
          <p class="text-gray-500">{{ $t("inbox.empty.list.subtitle") }}</p>
          <UButton to="/app/leads/scrape" class="mt-4">{{ $t("inbox.empty.list.cta") }}</UButton>
        </div>
      </div>
      <div v-else class="space-y-2 p-2">
        <NuxtLink
          v-for="conversation in formattedConversations"
          :key="conversation.to"
          :to="conversation.to"
          :class="['group flex items-center gap-2 rounded-md p-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50', conversation.class]"
        >
          <UAvatar v-if="conversation.icon" :icon="conversation.icon" size="sm" />
          <div class="flex-1">
            <p>{{ conversation.label }}</p>
            <p v-if="conversation.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ conversation.description }}</p>
          </div>
          <UBadge v-if="conversation.badge" color="primary" variant="solid">{{ conversation.badge }}</UBadge>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInboxStore } from '~/stores/inbox';
import type { Conversation } from '~/types/inbox';
import { UFieldGroup } from '#components';

const inboxStore = useInboxStore();
const { t } = useI18n();

const conversationStates = computed(() => ([
  { key: 'open', label: t('inbox.state.open') },
  { key: 'needs_approval', label: t('inbox.state.needs_approval') },
  { key: 'replied', label: t('inbox.state.replied') },
  { key: 'closed', label: t('inbox.state.closed') },
] as const));

const formattedConversations = computed(() => {
  return inboxStore.filteredConversations.map((conversation: Conversation) => ({
    label: conversation.lead.company_name,
    description: conversation.last_message_preview,
    badge: conversation.unread ? 'New' : undefined,
    icon: conversation.needs_approval ? 'i-heroicons-bell-alert' : undefined,
    to: `/app/inbox?conversation=${conversation.id}`,
    class: {
      'font-bold': conversation.unread,
      'border-l-4 border-orange-400': conversation.needs_approval,
      'bg-gray-100 dark:bg-gray-800': inboxStore.currentConversation?.id === conversation.id,
    },
    // Add more fields as per item_design
  }));
});

onMounted(() => {
  inboxStore.fetchConversations();
});

watch(() => inboxStore.currentConversation, (newConversation) => {
  if (newConversation) {
    // Mark as read logic here if needed
  }
});

// Handle deep linking for conversations
const route = useRoute();
watchEffect(() => {
  const conversationId = route.query.conversation as string;
  if (conversationId && inboxStore.conversations.length > 0) {
    const conversation = inboxStore.conversations.find(c => c.id === conversationId);
    if (conversation) {
      inboxStore.setCurrentConversation(conversation);
    }
  }
});
</script>

<style scoped>
/* Add any specific styles for ConversationList here */
</style>
