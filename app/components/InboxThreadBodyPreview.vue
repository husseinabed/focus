<template>
  <UCard :ui="{ body: { padding: 'p-4' } }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ $t('leads.details.tabs.messages') }}
        </h3>
      </div>
    </template>
    
    <div v-if="!messages?.length" class="text-sm text-gray-500 text-center py-4">
      No messages yet
    </div>

    <div v-else class="space-y-3">
      <div v-for="(msg, index) in messages.slice(-3)" :key="msg.id" class="text-sm">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium" :class="msg.is_outbound ? 'text-primary-600' : 'text-gray-900 dark:text-white'">
            {{ msg.is_outbound ? 'You' : (msg.sender_name || 'Lead') }}
          </span>
          <span class="text-xs text-gray-400">
            {{ new Date(msg.created_at).toLocaleDateString() }}
          </span>
        </div>
        <p class="text-gray-600 dark:text-gray-300 line-clamp-2">
          {{ msg.body || msg.content }}
        </p>
        <USeparator class="mt-3" v-if="index < messages.slice(-3).length - 1" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Message {
  id: string;
  body?: string;
  content?: string;
  created_at: string;
  is_outbound?: boolean;
  sender_name?: string;
  [key: string]: any;
}

defineProps<{
  messages?: Message[]
}>()
</script>
