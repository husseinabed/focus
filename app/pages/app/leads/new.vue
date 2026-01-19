<template>
  <UPage>
    <UPageHeader
      :title="$t(`leads.new.title`)"
      :description="$t(`leads.new.subtitle`)"
    />

    <UPageBody>
      <UContainer>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <!-- Left Column for Form -->
          <div class="col-span-12 md:col-span-8">
            <UForm
              id="new-lead-form"
              :state="state"
              :schema="LeadSchema"
              @submit="onSubmit"
              class="space-y-4"
            >
              <UCard
                v-if="hasDuplicates"
                class="mb-4"
                color="orange"
                variant="soft"
              >
               
                <template #header>
                  <h3 class="text-lg font-semibold">{{ i18n.t(`leads.new.dedupe.title`) }}</h3>
                </template>

                <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {{ i18n.t(`leads.new.dedupe.subtitle`) }}
                </div>

                <div v-for="(lead, index) in duplicateLeads" :key="index" class="mb-2">
                  <NuxtLink :to="localePath(`/app/leads/${lead.id}`)" class="text-primary-500 hover:underline">
                    <span class="font-semibold">{{ lead.company_name }}</span> ({{ lead.phone_e164 }})
                  </NuxtLink>
                </div>
 
                <template #footer>
                  <div class="flex justify-end gap-2">
                    <UButton
                      :label="i18n.t(`leads.new.dedupe.actions.open_existing`)"
                      color="primary"
                      variant="outline"
                      icon="i-heroicons-arrow-up-right-20-solid"
                      :to="duplicateLeads && duplicateLeads.length > 0 ? localePath(`/app/leads/${duplicateLeads[0].id}`) : undefined"
                      target="_blank"
                    />
                    <UButton
                      :label="i18n.t(`leads.new.dedupe.actions.merge`)"
                      color="neutral"
                      variant="soft"
                      icon="i-heroicons-arrows-pointing-in-20-solid"
                      :disabled="true"
                    > <!-- TODO: Implement merge functionality later -->
                    </UButton>
                    <UButton
                      :label="i18n.t(`leads.new.dedupe.actions.continue_anyway`)"
                      color="error"
                      variant="solid"
                      icon="i-heroicons-exclamation-triangle-20-solid"
                      @click="allowSubmissionAnyway = true; onSubmit({ preventDefault: () => {}, data: state })"
                    />
                  </div>
                </template>
              </UCard>
              <!-- Placeholder for form fields -->
              <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-white">{{ i18n.t(`leads.new.sections.core`) }}</h2>
              <UFormField
                :label="i18n.t(`leads.fields.company_name`)"
                :help="i18n.t(`leads.help.company_name`)"
                name="company_name"
                required
              >
                <UInput
                  ref="el => inputRefs[0] = el"
                  v-model="state.company_name"
                  type="text"
                  :placeholder="i18n.t(`leads.placeholders.company_name`)"
                  autofocus
                  @keydown.enter="focusNextField($event, 0)"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.full_name`)"
                name="full_name"
              >
                <UInput
                  ref="el => inputRefs[1] = el"
                  v-model="state.full_name"
                  type="text"
                  :placeholder="i18n.t(`leads.placeholders.full_name`)"
                  @keydown.enter="focusNextField($event, 1)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.phone`)"
                name="phone"
                required
              >
                <UInput
                  ref="el => inputRefs[2] = el"
                  v-model="state.phone"
                  type="tel"
                  :placeholder="i18n.t(`leads.placeholders.phone`)"
                  @keydown.enter="focusNextField($event, 2)"
                  class="w-full"

                />
                <!-- TODO: Implement advanced phone number features: country default IL, auto format, convert to e164, dedupe check -->
              </UFormField>

              <USeparator />

              <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-white">{{ i18n.t(`leads.new.sections.context`) }}</h2>

              <UFormField
                :label="i18n.t(`leads.fields.language`)"
                :help="i18n.t(`leads.help.language`)"
                name="language"
              >
                <USelect
                  ref="el => inputRefs[3] = el"
                  v-model="state.language"
                  :items="['auto', 'he', 'ar', 'en']"
                  @keydown.enter="focusNextField($event, 3)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.city`)"
                name="city"
              >
                <UInput
                  ref="el => inputRefs[4] = el"
                  v-model="state.city"
                  type="text"
                  @keydown.enter="focusNextField($event, 4)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.source`)"
                name="source"
              >
                <USelect
                  ref="el => inputRefs[5] = el"
                  v-model="state.source"
                  :items="['manual', 'import', 'google_maps', 'whatsapp_inbound']"
                  @keydown.enter="focusNextField($event, 5)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.status`)"
                name="status"
              >
                <USelect
                  ref="el => inputRefs[6] = el"
                  v-model="state.status"
                  :items="['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']"
                  @keydown.enter="focusNextField($event, 6)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.priority`)"
                name="priority"
              >
                <USelect
                  ref="el => inputRefs[7] = el"
                  v-model="state.priority"
                  :items="['low', 'medium', 'high']"
                  @keydown.enter="focusNextField($event, 7)"
                  class="w-full"

                />
              </UFormField>

              <USeparator />

              <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-white">{{ i18n.t(`leads.new.sections.online`) }}</h2>

              <UFormField
                :label="i18n.t(`leads.fields.website`)"
                name="website"
              >
                <UInput
                  ref="el => inputRefs[8] = el"
                  v-model="state.website"
                  type="url"
                  :placeholder="i18n.t(`leads.placeholders.website`)"
                  @keydown.enter="focusNextField($event, 8)"
                  class="w-full"

                />
                <!-- TODO: Implement auto add https if missing, optional audit later -->
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.email`)"
                name="email"
              >
                <UInput
                  ref="el => inputRefs[9] = el"
                  v-model="state.email"
                  type="email"
                  :placeholder="i18n.t(`leads.placeholders.email`)"
                  @keydown.enter="focusNextField($event, 9)"
                  class="w-full"

                />
              </UFormField>

              <USeparator />

              <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-white">{{ i18n.t(`leads.new.sections.notes`) }}</h2>

              <UFormField
                :label="i18n.t(`leads.fields.notes`)"
                name="notes"
              >
                <UTextarea
                  ref="el => inputRefs[10] = el"
                  v-model="state.notes"
                  :rows="4"
                  :placeholder="i18n.t(`leads.placeholders.notes`)"
                  @keydown.enter="focusNextField($event, 10)"
                  class="w-full"

                />
              </UFormField>

              <UFormField
                :label="i18n.t(`leads.fields.tags`)"
                name="tags"
              >
                <UInputTags
                  ref="el => inputRefs[11] = el"
                  v-model="state.tags"
                  :placeholder="i18n.t(`leads.placeholders.tags`)"
                  @keydown.enter="focusNextField($event, 11)"
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </div>

          <!-- Right Column for Preview/Next Steps -->
          <div class="col-span-12 md:col-span-4 space-y-4">
            <!-- Preview Card -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ i18n.t(`leads.new.preview.title`) }}</h3>
              </template>

              <div class="space-y-2">
                <p v-if="state.company_name">
                  <span class="font-semibold">{{ i18n.t(`leads.fields.company_name`) }}:</span> {{ state.company_name }}
                </p>
                <p v-if="state.full_name">
                  <span class="font-semibold">{{ i18n.t(`leads.fields.full_name`) }}:</span> {{ state.full_name }}
                </p>
                <p v-if="state.phone">
                  <span class="font-semibold">{{ i18n.t(`leads.fields.phone`) }}:</span> {{ state.phone }}
                </p>
                <div class="flex flex-wrap gap-2" v-if="state.language || state.source || state.status">
                  <UBadge
                    v-if="state.language"
                    :label="`${i18n.t(`leads.fields.language`)}: ${i18n.t(`common.languages.${state.language}`)}`"
                    color="primary"
                    variant="subtle"
                  />
                  <UBadge
                    v-if="state.source"
                    :label="`${i18n.t(`leads.fields.source`)}: ${i18n.t(`common.sources.${state.source}`)}`"
                    color="warning"
                    variant="subtle"
                  />
                  <UBadge
                    v-if="state.status"
                    :label="`${i18n.t(`leads.fields.status`)}: ${i18n.t(`common.status.${state.status}`)}`"
                    color="success"
                    variant="subtle"
                  />
                </div>
              </div>
            </UCard>

            <!-- Next Steps Card -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ i18n.t(`leads.new.next_steps.title`) }}</h3>
              </template>

              <div class="space-y-2">
                <UButton
                  block
                  size="lg"
                  icon="i-heroicons-paper-airplane"
                  :label="i18n.t(`leads.new.next_steps.start_outreach`)"
                  :to="createdLeadId ? localePath(`/app/inbox?lead=${createdLeadId}`) : undefined"
                  :disabled="!createdLeadId"
                  class="mb-2"
                  color="primary"
                  variant="solid"
                />
                <UButton
                  block
                  size="lg"
                  icon="i-heroicons-phone"
                  :label="i18n.t(`leads.new.next_steps.qualify_call`)"
                  :to="createdLeadId ? localePath(`/app/lead-qualification?lead=${createdLeadId}`) : undefined"
                  :disabled="!createdLeadId"
                  class="mb-2"
                  color="primary"
                  variant="outline"
                />
                <UButton
                  block
                  size="lg"
                  icon="i-heroicons-calendar"
                  :label="i18n.t(`leads.new.next_steps.book_proposal`)"
                  :to="createdLeadId ? localePath(`/app/meetings/new?lead=${createdLeadId}&type=proposal`) : undefined"
                  :disabled="!createdLeadId"
                  color="primary"
                  variant="outline"
                />
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                  {{ i18n.t(`leads.new.next_steps.trust_note`) }}
                </p>
              </div>
            </UCard>

            <!-- Tips Section -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ i18n.t(`leads.new.sections.tips`) }}</h3>
              </template>
              <ul class="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li v-for="(tipKey, index) in Object.keys(i18n.tm(`leads.new.tips`))" :key="index">
                  {{ i18n.t(`leads.new.tips.${tipKey}`) }}
                </li>
              </ul>
            </UCard>
          </div>
        </div>
      </UContainer>
    </UPageBody>
sadasds
    <div class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 ">
      <UButton
        label="Cancel"
        color="neutral"
        variant="soft"
        icon="i-heroicons-x-mark-20-solid"
        :to="localePath('/app/leads')"
      />
      <UButton
        label="Save"
        type="submit"
        icon="i-heroicons-check-20-solid"
        form="new-lead-form"
        :disabled="hasDuplicates && !allowSubmissionAnyway"
      />
    </div>
  </UPage>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { z } from 'zod';
import { useDebounceFn } from '@vueuse/core';
import { LeadSchema } from '~/types/leads';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useWorkspaceStore } from '~/stores/workspace';
definePageMeta({
  layout: 'app'
})
const inputRefs = ref<any[]>([]);

const focusNextField = (event: KeyboardEvent, currentIndex: number) => {
  if (event.key === 'Enter' && !event.shiftKey) { // Allow Shift+Enter for new lines if needed, though this logic was preventing default submit
      event.preventDefault(); // Prevent form submission on enter
      const nextIndex = currentIndex + 1;
      if (nextIndex < inputRefs.value.length) {
        const nextComponent = inputRefs.value[nextIndex];
        // Handle Nuxt UI components which expose input via $el or specific methods if available
        const nextElement = nextComponent?.$el?.querySelector('input, textarea, select') || nextComponent?.$el;
        
        if (nextElement && typeof nextElement.focus === 'function') {
          nextTick(() => {
            nextElement.focus();
          });
        }
      } else {
        // If it's the last field, submit the form
        onSubmit({ preventDefault: () => {}, data: state.value });
      }
  }
};
 
const handleSaveShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault(); // Prevent default browser behavior (e.g., new line in textarea)
    // Trigger form submission
    onSubmit({ preventDefault: () => {}, data: state.value });
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleSaveShortcut);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleSaveShortcut);
});

const i18n = useI18n();
const localePath = useLocalePath();
const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();
const user = useSupabaseUser();
const workspaceStore = useWorkspaceStore();

const workspaceId = computed(() => workspaceStore.activeWorkspaceId);

// State for the newly created lead ID, used for next steps actions
const createdLeadId = ref<string | null>(null);

// Deduplication state
const hasDuplicates = ref(false);
const duplicateLeads = ref<Array<any> | null>(null);
const allowSubmissionAnyway = ref(false);
const isCheckingDuplicates = ref(false);

// Initialize state with default values from LeadSchema
// This ensures all fields expected by the schema are present
const state = ref<z.infer<typeof LeadSchema>>({
  company_name: '',
  full_name: undefined,
  phone: '', // This will be phone_e164 for dedupe check
  language: 'auto',
  city: undefined,
  source: 'manual',
  status: 'new',
  priority: 'medium',
  website: undefined,
  email: undefined,
  notes: undefined,
  tags: undefined,
});

// Function to check for duplicate leads
const dedupeLeads = useDebounceFn(async (phone_e164: string) => {
  if (!phone_e164) {
    hasDuplicates.value = false;
    duplicateLeads.value = null;
    return;
  }

  if (!workspaceId.value) {
    console.warn('Skipping deduplication check: No active workspace ID');
    return;
  }

  isCheckingDuplicates.value = true;
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, company_name, phone_e164, status, created_at')
      .eq('workspace_id', workspaceId.value) // Using computed workspaceId
      .eq('phone_e164', phone_e164)
      .limit(5);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      hasDuplicates.value = true;
      duplicateLeads.value = data;
      allowSubmissionAnyway.value = false; // Reset on new dedupe check
    } else {
      hasDuplicates.value = false;
      duplicateLeads.value = null;
    }
  } catch (error: any) {
    console.error('Error checking for duplicates:', error.message);
    toast.add({
      title: i18n.t('leads.new.dedupe.toast.error.title'),
      description: error.message || i18n.t('leads.new.dedupe.toast.error.description'),
      icon: 'i-heroicons-x-circle',
      color: 'error',
    });
  } finally {
    isCheckingDuplicates.value = false;
  }
}, 500); // Debounce for 500ms

watch(() => state.value.phone, (newPhone) => {
  dedupeLeads(newPhone);
}, { immediate: true }); // Immediate to check on load if phone has a value

async function onSubmit(event: { preventDefault: () => void; data: any; }) {
  if (!workspaceId.value) {
     toast.add({
      title: i18n.t('leads.new.toast.error.title'),
      description: 'Cannot create lead: No active workspace',
      icon: 'i-heroicons-x-circle',
      color: 'error',
    });
    return;
  }

  // Prevent submission if duplicates are found and 'continue anyway' is not chosen
  if (hasDuplicates.value && !allowSubmissionAnyway.value) {
    toast.add({
      title: i18n.t('leads.new.dedupe.toast.prevented.title'),
      description: i18n.t('leads.new.dedupe.toast.prevented.description'),
      icon: 'i-heroicons-exclamation-triangle',
      color: 'warning',
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...event.data,
        workspace_id: workspaceId.value, // Ensure workspace_id is included on submission
        phone_e164: event.data.phone, // Assuming 'phone' in state is already e164 or will be converted
      })
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const newLead = data[0];
      if (newLead) {
        createdLeadId.value = newLead.id; // Set the created lead ID

        // Reset dedupe state on successful submission
        hasDuplicates.value = false;
        duplicateLeads.value = null;
        allowSubmissionAnyway.value = false;

        // Placeholder for "create conversation if not exists"
        console.log('TODO: Implement create conversation if not exists for lead:', newLead.id);

        toast.add({
          title: i18n.t('leads.new.toast.success.title'),
          description: i18n.t('leads.new.toast.success.description', { company_name: newLead.company_name }),
          icon: 'i-heroicons-check-circle',
        color: 'success',
      });

      // await router.push(localePath(`/app/leads/${newLead.id}`)); // Do not redirect immediately
      }
    }
  } catch (error: any) {
    toast.add({
      title: i18n.t('leads.new.toast.error.title'),
      description: error.message || i18n.t('leads.new.toast.error.description'),
      icon: 'i-heroicons-x-circle',
      color: 'error',
    });
  }
}
</script>
