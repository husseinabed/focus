<template>
  <div class="approval-preview">
    <!-- Header Information -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <UButton
          icon="i-heroicons-arrow-left"
          color="neutral"
          variant="ghost"
          @click="$router.back()"
        />
        <h2 class="text-xl font-semibold">
          {{ lead.name }} <span v-if="lead.company">({{ lead.company }})</span>
        </h2>
      </div>
      <div class="flex items-center space-x-2">
        <UButton
          icon="i-heroicons-arrow-up-right-from-square"
          color="neutral"
          variant="ghost"
          label="Conversation"
          :to="`/app/inbox?leadId=${lead.id}`"
          target="_blank"
        />
        <span class="text-sm text-gray-500">{{ formatDate(approval.created_at) }}</span>
      </div>
    </div>

    <!-- Template Badge -->
    <div v-if="approval.template_id" class="mb-4">
      <UBadge color="blue" variant="subtle" size="lg" label="Template" />
    </div>

    <!-- Message Body -->
    <UFormField label="Message Body" class="mb-4">
      <UTextarea v-model="messageBody" :rows="10" class="w-full" />
    </UFormField>

    <!-- Trust Warning and Compliance Hints -->
    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <p class="font-bold">Trust Warning</p>
      <p>This message will be sent to the lead. Ensure it aligns with compliance guidelines.</p>
      <p>Compliance hints: Avoid spammy language, be respectful, and provide clear value.</p>
    </div>

    <!-- Reject Reason -->
    <UCard v-if="showRejectReason" class="mb-4">
      <template #header>
        <h3 class="text-lg font-semibold">Reject Reason</h3>
      </template>
      <UFormField label="Reason for rejection" :error="rejectReasonError" class="mb-4">
        <UTextarea v-model="rejectReason" :rows="3" class="w-full" />
      </UFormField>
      <UFieldGroup label="Suggestions" class="space-x-2">
        <UButton
          v-for="suggestion in rejectReasonSuggestions"
          :key="suggestion"
          color="neutral"
          variant="outline"
          size="sm"
          @click="addRejectReasonSuggestion(suggestion)"
          >{{ suggestion }}</UButton
        >
      </UFieldGroup>
    </UCard>

    <!-- Actions -->
    <div class="flex justify-end space-x-3">
      <UButton color="red" variant="solid" label="Reject" @click="toggleRejectReason" />
      <UButton color="neutral" variant="outline" label="Approve Only" @click="approveOnly" />
      <UButton color="primary" variant="solid" label="Approve and Send" @click="approveAndSend" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lead, Approval } from '~~/types/leads';

const props = defineProps({
  lead: {
    type: Object as PropType<Lead>,
    required: true,
  },
  approval: {
    type: Object as PropType<Approval>,
    required: true,
  },
});

const messageBody = ref(props.approval.message_body);
const showRejectReason = ref(false);
const rejectReason = ref('');
const rejectReasonSuggestions = [
  'Inaccurate information',
  'Grammar mistakes',
  'Tone is inappropriate',
  'Not aligned with company policy',
];

const rejectReasonError = computed(() => {
  if (showRejectReason.value && !rejectReason.value) {
    return 'Reject reason is required.';
  }
  return undefined;
});

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const toggleRejectReason = () => {
  showRejectReason.value = !showRejectReason.value;
  if (!showRejectReason.value) {
    rejectReason.value = '';
  }
};

const addRejectReasonSuggestion = (suggestion: string) => {
  if (rejectReason.value) {
    rejectReason.value += ', ' + suggestion;
  } else {
    rejectReason.value = suggestion;
  }
};

const approveAndSend = () => {
  if (showRejectReason.value && rejectReasonError.value) {
    // Handle validation error
    return;
  }
  console.log('Approve and Send action', messageBody.value);
  // Implement actual approve and send logic here
};

const approveOnly = () => {
  if (showRejectReason.value && rejectReasonError.value) {
    // Handle validation error
    return;
  }
  console.log('Approve Only action', messageBody.value);
  // Implement actual approve only logic here
};

// RTL compatibility (assuming `dir` attribute on `html` or `body` for global RTL)
// No specific code needed in the component itself unless styling needs to be dynamic based on RTL
</script>

<style scoped>
/* Add any specific styles here if needed */
/* For RTL, if global CSS variables or utilities are used, they will apply automatically. */
/* If specific RTL adjustments are needed, they would go here, e.g.: */
/* .approval-preview[dir='rtl'] .some-element { float: right; } */
</style>
