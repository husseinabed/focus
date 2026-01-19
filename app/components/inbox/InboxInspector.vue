<template>
  <div v-if="inboxStore.currentConversation" class="flex flex-col h-full border-l border-gray-200 dark:border-gray-800">
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
      <h3 class="text-xl font-semibold">{{ $t("inbox.inspector.lead_details") }}</h3>
      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        color="neutral"
        class="lg:hidden"
        @click="inboxStore.toggleInspector()"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <UAccordion :items="inspectorSections" class="p-4">
        <template #item="{ item }">
          <div v-if="item.key === 'lead_details'">
            <UFormField label="Phone">
              <UInput :model-value="inboxStore.currentConversation.lead.phone" readonly>
                <template #trailing>
                  <UButton
                    icon="i-heroicons-clipboard"
                    color="neutral"
                    variant="ghost"
                    @click="copyToClipboard(inboxStore.currentConversation.lead.phone)"
                  />
                  <UButton
                    icon="i-heroicons-phone"
                    color="neutral"
                    variant="ghost"
                    :to="`https://wa.me/${inboxStore.currentConversation.lead.phone_e164}`"
                    target="_blank"
                  />
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Website">
              <UInput :model-value="inboxStore.currentConversation.lead.website" readonly>
                <template #trailing>
                  <UButton
                    icon="i-heroicons-arrow-top-right-on-square"
                    color="neutral"
                    variant="ghost"
                    :to="inboxStore.currentConversation.lead.website"
                    target="_blank"
                  />
                </template>
              </UInput>
            </UFormField>

            <UFormField label="Email">
              <UInput :model-value="inboxStore.currentConversation.lead.email" readonly>
                <template #trailing>
                  <UButton
                    icon="i-heroicons-clipboard"
                    color="neutral"
                    variant="ghost"
                    @click="copyToClipboard(inboxStore.currentConversation.lead.email || '')"
                  />
                </template>
              </UInput>
            </UFormField>

            <UFormField label="City">
              <UInput :model-value="inboxStore.currentConversation.lead.city" readonly />
            </UFormField>

            <UFormField label="Language">
              <UInput :model-value="inboxStore.currentConversation.lead.language" readonly />
            </UFormField>

            <UFormField label="Status">
              <USelectMenu
                v-model="inboxStore.currentConversation.lead.status"
                :options="leadStatuses"
                value-attribute="key"
                option-attribute="label"
                class="w-full"
              />
            </UFormField>

            <div class="flex gap-2 mt-4">
              <UButton
                :label="$t('inbox.inspector.edit_lead')"
                icon="i-heroicons-pencil"
                color="neutral"
                variant="ghost"
                :to="`/app/leads/${inboxStore.currentConversation.lead_id}/edit`"
                class="flex-1"
              />
              <UButton
                :label="$t('inbox.inspector.qualify')"
                icon="i-heroicons-check-badge"
                color="neutral"
                variant="soft"
                :to="`/app/lead-qualification?lead=${inboxStore.currentConversation.lead_id}`"
                class="flex-1"
              />
            </div>
          </div>

          <div v-else-if="item.key === 'automation_status'">
            <UFormField label="Conversation State">
              <UInput :model-value="inboxStore.currentConversation.status" readonly />
            </UFormField>
            <UFormField v-if="inboxStore.currentConversation.stopped" label="Stop Reason">
              <UInput model-value="Automation stopped by user" readonly />
            </UFormField>
            <UFormField label="Last Inbound">
              <UInput :model-value="formatDateTime(inboxStore.currentConversation.last_message_at)" readonly />
            </UFormField>
            <UFormField label="Last Outbound">
              <UInput :model-value="formatDateTime(inboxStore.currentConversation.last_message_at)" readonly />
            </UFormField>
            <UFormField label="Approval Required">
              <UInput :model-value="inboxStore.currentConversation.needs_approval ? 'Yes' : 'No'" readonly />
            </UFormField>

            <div class="flex gap-2 mt-4">
              <UButton
                :label="$t('inbox.inspector.pause')"
                icon="i-heroicons-pause-circle"
                color="neutral"
                variant="soft"
                class="flex-1"
              />
              <UButton
                :label="$t('inbox.inspector.stop')"
                icon="i-heroicons-stop-circle"
                color="error"
                variant="soft"
                class="flex-1"
              />
            </div>
          </div>

          <div v-else-if="item.key === 'workflow_controls'">
            <UFormField label="Select Workflow">
              <USelectMenu :options="['Workflow A', 'Workflow B']" placeholder="Select a workflow" class="w-full" />
            </UFormField>
            <UButton label="Start Workflow" color="primary" variant="solid" class="mt-4 w-full" />
            <UButton label="View Workflow Logs" color="neutral" variant="ghost" class="mt-2 w-full" />
          </div>
        </template>
      </UAccordion>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-full text-gray-500">
    {{ $t("inbox.empty.thread.title") }}
  </div>
</template>

<script setup lang="ts">
import { useInboxStore } from "~/stores/inbox";

const inboxStore = useInboxStore();
const { t } = useI18n();

const inspectorSections = computed(() => [
  {
    key: "lead_details",
    label: t("inbox.inspector.lead_details"),
    icon: "i-heroicons-user",
    defaultOpen: true,
  },
  {
    key: "automation_status",
    label: t("inbox.inspector.automation_status"),
    icon: "i-heroicons-cog-6-tooth",
    defaultOpen: true,
  },
  {
    key: "workflow_controls",
    label: t("inbox.inspector.workflows"),
    icon: "i-heroicons-arrows-right-left",
    defaultOpen: true,
  },
]);

const leadStatuses = computed(() => [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
]);

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
    console.log("Copied to clipboard:", text);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};
</script>

<style scoped>
/* Add any specific styles for ConversationList here */
</style>
