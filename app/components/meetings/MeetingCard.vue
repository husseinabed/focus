<script setup lang="ts">
import type { Meeting } from '~/types/meetings';
import type { Lead } from '~/types/leads';

interface MeetingWithLead extends Meeting {
  lead: Lead;
}

const props = defineProps({
  meeting: {
    type: Object as PropType<MeetingWithLead>,
    required: true,
  },
});

const providerIcon = computed(() => {
  switch (props.meeting.provider) {
    case "zoom":
      return "i-heroicons-video-camera";
    case "google_meet":
      return "i-heroicons-globe-alt";
    case "manual":
      return "i-heroicons-map-pin";
    default:
      return "i-heroicons-question-mark-circle";
  }
});

const formattedStartTime = computed(() => {
  const date = new Date(props.meeting.start_time);
  return date.toLocaleString(); // You might want to format this more specifically
});
</script>

<template>
  <UCard class="w-full">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ meeting.title }}</h3>
        <p class="text-gray-500 dark:text-gray-400">
          {{ meeting.lead.full_name || meeting.lead.company_name }}
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <MeetingTypeBadge :type="meeting.type" />
        <MeetingStatusChip :status="meeting.status" />
      </div>
    </div>

    <USeparator class="my-4" />

    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
      <div class="flex items-center space-x-1">
        <UIcon :name="providerIcon" class="w-4 h-4" />
        <span>{{ formattedStartTime }}</span>
      </div>
      <!-- Additional meeting details can go here, e.g., duration, location -->
    </div>
  </UCard>
</template>
