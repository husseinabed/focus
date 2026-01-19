<script setup lang="ts">
import type { Meeting } from '~/types/meetings';
import MeetingTypeBadge from '~/components/meetings/MeetingTypeBadge.vue';
import MeetingStatusChip from '~/components/meetings/MeetingStatusChip.vue';
definePageMeta({
  layout: 'app'
})
const route = useRoute();
const { t } = useI18n();

const { data: meeting, pending, error } = useFetch<Meeting>(`/api/meetings/${route.params.id}`);

const crumbs = computed(() => [
  {
    label: t('meetings.title'),
    to: '/app/meetings',
  },
  {
    label: meeting.value?.title || t('meetings.detail'),
    to: `/app/meetings/${route.params.id}`,
  },
]);

const actions = computed(() => [
  {
    label: t('common.edit'),
    icon: 'i-heroicons-pencil-square',
    to: `/app/meetings/${route.params.id}/edit`,
  },
  {
    label: t('meetings.actions.join'),
    icon: 'i-heroicons-arrow-top-right-on-square',
    target: '_blank',
    to: meeting.value?.meeting_url,
    disabled: !meeting.value?.meeting_url,
  },
]);

// Placeholder for date and time formatting (will be implemented later)
const formattedMeetingTime = computed(() => {
  if (!meeting.value?.start_time) return '';
  const date = new Date(meeting.value.start_time);
  return date.toLocaleString(); // Basic formatting
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar :title="meeting?.title || t('meetings.detail')" :badge="crumbs.length">
        <template #title>
          <div class="flex items-center gap-2">
            <p class="text-2xl font-semibold leading-6 text-gray-900 dark:text-white">
              {{ meeting?.title || t('meetings.detail') }}
            </p>
            <MeetingTypeBadge v-if="meeting?.type" :type="meeting.type" />
            <MeetingStatusChip v-if="meeting?.status" :status="meeting.status" />
          </div>
        </template>

        <template #right>
          <UButton v-for="action in actions" v-bind="action" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UBreadcrumb :links="crumbs" />
        </template>
      </UDashboardToolbar>

      <div class="p-4">
        <div v-if="pending">
          <p>Loading meeting details...</p>
        </div>
        <div v-else-if="error">
          <p>Error loading meeting details: {{ error.message }}</p>
        </div>
        <div v-else-if="meeting">
          <UCard class="mb-4">
            <template #header>
              <h2 class="text-xl font-semibold">{{ t('meetings.sections.info') }}</h2>
            </template>
            <div class="space-y-4">
              <UFormField :label="t('meetings.attributes.time')">
                <p>{{ formattedMeetingTime }}</p>
              </UFormField>
              <UFormField :label="t('meetings.attributes.timezone')">
                <p>{{ meeting.timezone }}</p>
              </UFormField>
              <UFormField :label="t('meetings.attributes.provider')">
                <p>{{ meeting.provider }}</p>
              </UFormField>
            </div>
          </UCard>

          <UCard class="mb-4">
            <template #header>
              <h2 class="text-xl font-semibold">{{ t('meetings.sections.leadSummary') }}</h2>
            </template>
            <UFormField :label="t('common.lead')">
              <NuxtLink v-if="meeting.lead" :to="`/app/leads/${meeting.lead_id}`" class="text-primary hover:underline">
                {{ meeting.lead.name }} ({{ meeting.lead.company }})
              </NuxtLink>
              <p v-else>{{ t('meetings.noLead') }}</p>
            </UFormField>
          </UCard>

          <UCard v-if="meeting.workflow_run_id" class="mb-4">
            <template #header>
              <h2 class="text-xl font-semibold">{{ t('meetings.sections.workflowContext') }}</h2>
            </template>
            <UFormField :label="t('meetings.attributes.workflowRunId')">
              <p>{{ meeting.workflow_run_id }}</p>
            </UFormField>
            <!-- Add more workflow details here if available in the meeting object -->
          </UCard>

          <UCard class="mb-4">
            <template #header>
              <h2 class="text-xl font-semibold">{{ t('meetings.sections.internalNotes') }}</h2>
            </template>
            <UFormField :label="t('common.notes')">
              <p>{{ meeting.internal_notes || t('meetings.noNotes') }}</p>
            </UFormField>
          </UCard>
        </div>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style scoped></style>
