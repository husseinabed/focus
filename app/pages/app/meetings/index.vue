<script setup lang="ts">
import type { Meeting } from '~/types/meetings';
import DatePicker from '~/components/forms/DatePicker.vue';
definePageMeta({
  layout: 'app'
})
const query = ref({
  q: '',
  type: '',
  status: '',
  date_range: [] as [Date, Date] | [],
});

const { data: meetings, pending, refresh } = useAsyncData(
  () => {
    const params = new URLSearchParams();
    if (query.value.q) {
      params.append('q', query.value.q);
    }
    if (query.value.type) {
      params.append('type', query.value.type);
    }
    if (query.value.status) {
      params.append('status', query.value.status);
    }
    if (query.value.date_range && query.value.date_range.length === 2) {
      params.append('start_date', query.value.date_range[0].toISOString());
      params.append('end_date', query.value.date_range[1].toISOString());
    }
    return $fetch<{ meetings: Meeting[] }>('/api/meetings', { params });
  },
  { watch: [query], default: () => ({ meetings: [] }), lazy: true }
);

const router = useRouter();
const createNewMeeting = () => {
  router.push('/app/meetings/new');
};

const viewMeeting = (id: string) => {
  router.push(`/app/meetings/${id}`);
};

const types = [
  { label: 'All', value: '' },
  { label: 'Type A', value: 'type-a' },
  { label: 'Type B', value: 'type-b' },
];

const statuses = [
  { label: 'All', value: '' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];
</script>

<template>
  <UMain>
    <UContainer>
      <UPageHeader
        title="Meetings"
        description="Manage your scheduled and completed meetings"
      >
        <template #actions>
          <UButton
            icon="i-heroicons-plus"
            size="sm"
            color="primary"
            label="New Meeting"
            :to="`/app/meetings/new`"
          />
        </template>
      </UPageHeader>

      <UCard class="w-full mt-8">
        <template #header>
          <UInput
            v-model="query.q"
            placeholder="Search meetings..."
            icon="i-heroicons-magnifying-glass"
            class="w-full"
          />
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <UFormField label="Type">
              <USelect
                v-model="query.type"
                :options="types"
                option-attribute="label"
                value-attribute="value"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Status">
              <USelect
                v-model="query.status"
                :options="statuses"
                option-attribute="label"
                value-attribute="value"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Date Range">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  icon="i-heroicons-calendar-days-20-solid"
                  class="w-full"
                  color="neutral"
                  :label="query.date_range && query.date_range.length === 2 ? `${query.date_range[0].toLocaleDateString()} - ${query.date_range[1].toLocaleDateString()}` : 'Select a date range'"
                />
                <template #content>
                  <DatePicker v-model="query.date_range" />
                </template>
              </UPopover>
            </UFormField>
          </div>
        </template>

        <div v-if="pending" class="flex justify-center items-center py-8">
          <UProgress animation="carousel" />
        </div>
        <div v-else-if="meetings && meetings.meetings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MeetingCard
            v-for="meeting in meetings.meetings"
            :key="meeting.id"
            :meeting="meeting"
            @click="viewMeeting(meeting.id)"
          />
        </div>
        <div v-else class="flex flex-col items-center justify-center py-8">
          <UIcon name="i-heroicons-calendar"
            class="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-xl font-semibold text-gray-900 dark:text-white">No meetings found</p>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Get started by creating a new meeting.</p>
          <UButton
            class="mt-4"
            icon="i-heroicons-plus"
            size="sm"
            color="primary"
            label="New Meeting"
            :to="`/app/meetings/new`"
          />
        </div>
      </UCard>
    </UContainer>
  </UMain>
</template>