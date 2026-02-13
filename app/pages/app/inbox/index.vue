<template>
  <UMain>
    <UContainer :dir="localeProperties.dir" class="flex gap-4">
      <UCard class="flex-1">
        <template #header>
          <h2 class="text-xl font-semibold">{{ t('messageComposer.title') }}</h2>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Message Input -->
          <UFormField :label="t('messageComposer.messageLabel')">
            <UTextarea v-model="messageContent" :placeholder="t('messageComposer.messagePlaceholder')" />
          </UFormField>

          <!-- Attachment Handling -->
          <UFormField :label="t('messageComposer.attachmentsLabel')">
            <div class="border border-neutral-300 dark:border-neutral-700 rounded-md p-4">
              <p>{{ t('messageComposer.attachmentsPlaceholder') }}</p>
              <!-- Future attachment upload/preview components -->
            </div>
          </UFormField>

          <!-- Language Override -->
          <UFormField :label="t('messageComposer.replyLanguageLabel')">
            <USelect v-model="replyLanguage" :items="availableLanguages" option-attribute="label" value-attribute="value" class="w-full" />
          </UFormField>

          <!-- Send Modes and Actions -->
          <USeparator />

          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <UDropdownMenu :items="sendModes" :popper="{ placement: 'top-start' }">
                <UButton color="neutral" :label="currentSendModeLabel" trailing-icon="i-lucide-chevron-down" />
              </UDropdownMenu>

              <!-- Conditional 'Request Approval' / 'Send' button -->
              <UButton v-if="showRequestApprovalButton" color="primary" :label="t('messageComposer.requestApproval')" @click="requestApproval" />
              <UButton v-else color="primary" :label="t('messageComposer.sendNow')" @click="sendMessage" />
            </div>

            <!-- Other actions like schedule if currentSendMode is 'schedule' -->
            <div v-if="selectedSendMode.value === 'schedule'" class="flex gap-2 items-center">
              <UInput type="datetime-local" v-model="scheduledDateTime" />
              <UButton color="neutral" :label="t('messageComposer.scheduleButton')" @click="scheduleMessage" />
            </div>
          </div>
        </div>
      </UCard>

      <InboxInspector />
    </UContainer>
  </UMain>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, localeProperties } = useI18n();

// Reactive state for message content and settings
const messageContent = ref('');
const replyLanguage = ref('en'); // Default to English, will be auto-filled by lead.language
const scheduledDateTime = ref('');

// Example lead data (will be passed as a prop in a real scenario)
const lead = ref({
  language: 'en',
  isAdmin: false,
});

// Example UI behaviors (will be fetched from global settings/store)
const ui_behaviors = ref({
  approvalPolicyEnabled: true,
});

// Available languages for override
const availableLanguages = [
  { label: t('languages.en'), value: 'en' },
  { label: t('languages.ar'), value: 'ar' },
  { label: t('languages.he'), value: 'he' },
];

// Send modes
const sendModes = computed(() => [
  [{
    label: t('messageComposer.sendNow'),
    icon: 'i-lucide-send',
    value: 'send_now',
    click: () => selectedSendMode.value = sendModes.value[0][0],
  }],
  [{
    label: t('messageComposer.schedule'),
    icon: 'i-lucide-calendar',
    value: 'schedule',
    click: () => selectedSendMode.value = sendModes.value[1][0],
  }],
  [{
    label: t('messageComposer.requestApproval'),
    icon: 'i-lucide-check-circle',
    value: 'request_approval',
    click: () => selectedSendMode.value = sendModes.value[2][0],
  }],
]);

const selectedSendMode = ref(sendModes.value[0][0]); // Default to 'Send Now'

const currentSendModeLabel = computed(() => selectedSendMode.value.label);

// Logic for conditionally showing "Request approval" instead of "Send"
const showRequestApprovalButton = computed(() => {
  const isApprovalRequired = ui_behaviors.value.approvalPolicyEnabled;
  const isUserNonAdmin = !lead.value.isAdmin; // Assuming lead.isAdmin indicates if the current user is an admin

  return isApprovalRequired || isUserNonAdmin;
});

// Action functions
const sendMessage = () => {
  console.log('Sending message:', messageContent.value, 'Language:', replyLanguage.value);
  // Implement actual send logic here
};

const requestApproval = () => {
  console.log('Requesting approval for message:', messageContent.value, 'Language:', replyLanguage.value);
  // Implement actual request approval logic here
};

const scheduleMessage = () => {
  console.log('Scheduling message for:', scheduledDateTime.value, 'Content:', messageContent.value, 'Language:', replyLanguage.value);
  // Implement actual schedule logic here
};

// Initialize reply language from lead.language
// This would typically happen when the component mounts or when a new lead is selected.
// For now, let's simulate it.
watchEffect(() => {
  if (lead.value.language) {
    replyLanguage.value = lead.value.language;
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
