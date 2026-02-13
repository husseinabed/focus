<template>
  <UPage :dir="isRtl ? 'rtl' : 'ltr'">
    <UPageHeader :title="t('leads.new.title')" :description="t('leads.new.subtitle')">
      <template #actions>
        <UButton :label="t('common.cancel')" color="neutral" variant="ghost" to="/app/leads" />
        <UButton
          :label="t('common.create')"
          color="primary"
          :loading="isSubmitting"
          form="lead_create_form"
          type="submit"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <UContainer>
        <UForm
          id="lead_create_form"
          :state="state"
          :schema="CreateLeadSchema"
          @submit="onSubmit"
          class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
        >
          <div class="space-y-6">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Lead creation goals</h3>
              </template>
              <ul class="text-sm text-gray-600 space-y-2">
                <li>Fast lead creation (≤60s)</li>
                <li>Clear required vs optional fields</li>
                <li>Support manual + imported context</li>
                <li>Prepare data for workflows & inbox</li>
              </ul>
              <p class="text-xs text-gray-500 mt-4">Fields marked with * are required.</p>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ t('leads.new.sections.core') }}</h3>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField :label="t('leads.fields.full_name')" name="full_name" required>
                  <UInput v-model="state.full_name" placeholder="John Doe" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.company_name')" name="company_name">
                  <UInput v-model="state.company_name" placeholder="Acme Ltd" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.language')" name="language" required>
                  <USelectMenu
                    v-model="state.language"
                    :items="languageOptions"
                    option-attribute="label"
                    value-attribute="value"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('leads.fields.status')" name="status" required>
                  <USelectMenu
                    v-model="state.status"
                    :items="statusOptions"
                    option-attribute="label"
                    value-attribute="value"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ t('leads.new.sections.contact') }}</h3>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField
                  :label="t('leads.fields.phone')"
                  name="phone"
                  :help="t('leads.helpers.phone_local')"
                >
                  <UInput v-model="state.phone" placeholder="050-123-4567" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.phone_e164')" name="phone_e164">
                  <UInput v-model="state.phone_e164" placeholder="+972501234567" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.email')" name="email">
                  <UInput v-model="state.email" type="email" placeholder="name@example.com" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.website')" name="website">
                  <UInput v-model="state.website" type="url" placeholder="https://example.com" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ t('leads.new.sections.meta') }}</h3>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField :label="t('leads.fields.city')" name="city">
                  <UInput v-model="state.city" placeholder="Haifa" class="w-full" />
                </UFormField>

                <UFormField :label="t('leads.fields.source')" name="source" required>
                  <USelectMenu
                    v-model="state.source"
                    :items="sourceOptions"
                    option-attribute="label"
                    value-attribute="value"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('leads.fields.priority')" name="priority">
                  <USelectMenu
                    v-model="state.priority"
                    :items="priorityOptions"
                    option-attribute="label"
                    value-attribute="value"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('leads.fields.tags')" name="tags">
                  <USelectMenu
                    v-model="state.tags"
                    :items="tagOptions"
                    option-attribute="label"
                    value-attribute="value"
                    multiple
                    creatable
                    searchable
                    class="w-full"
                    placeholder="law, urgent, referral"
                  />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ t('leads.new.sections.notes') }}</h3>
              </template>
              <UFormField :label="t('leads.fields.notes')" name="notes">
                <UTextarea v-model="state.notes" :rows="4" class="w-full" />
              </UFormField>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">{{ t('leads.new.sections.custom') }}</h3>
              </template>
              <UFormField :label="t('leads.fields.custom_fields')" name="custom_fields_json" :help="t('leads.helpers.custom_fields')">
                <UTextarea v-model="state.custom_fields_json" :rows="4" class="w-full font-mono text-xs" />
              </UFormField>
            </UCard>

            <UCard v-if="hasDuplicates" color="warning" variant="soft">
              <template #header>
                <h3 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-heroicons-exclamation-triangle" />
                  Possible duplicates
                </h3>
              </template>
              <p class="text-sm text-gray-700 mb-3">A lead with the same phone exists. Review before creating.</p>
              <ul class="list-disc list-inside text-sm space-y-1 mb-4">
                <li v-for="dup in duplicateLeads" :key="dup.id">
                  <NuxtLink :to="localePath(`/app/leads/${dup.id}`)" target="_blank" class="underline font-medium">
                    {{ dup.company_name }}
                  </NuxtLink>
                  <span class="opacity-75"> ({{ dup.phone_e164 }})</span>
                </li>
              </ul>
              <UButton color="warning" variant="soft" @click="allowSubmissionAnyway = true">
                Continue anyway
              </UButton>
            </UCard>
          </div>

          <div class="space-y-6 lg:sticky lg:top-4 h-fit">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Summary</h3>
              </template>
              <div class="flex flex-wrap gap-2 mb-4">
                <UBadge :color="statusColor[state.status] || 'neutral'" variant="subtle">
                  {{ statusLabel }}
                </UBadge>
                <UBadge :color="priorityColor[state.priority] || 'neutral'" variant="subtle">
                  {{ priorityLabel }}
                </UBadge>
                <UBadge color="neutral" variant="outline">
                  {{ languageLabel }}
                </UBadge>
                <UBadge color="neutral" variant="soft">
                  {{ sourceLabel }}
                </UBadge>
              </div>
              <div class="space-y-2">
                <UButton
                  v-if="state.phone || state.phone_e164"
                  :to="`tel:${state.phone_e164 || state.phone}`"
                  icon="i-heroicons-phone"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  block
                  class="justify-start"
                >
                  {{ state.phone_e164 || state.phone }}
                </UButton>
                <UButton
                  v-if="state.website"
                  :to="state.website"
                  target="_blank"
                  icon="i-heroicons-globe-alt"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  block
                  class="justify-start"
                >
                  {{ state.website }}
                </UButton>
              </div>
              <USeparator class="my-4" />
              <UButton type="submit" block color="primary" :loading="isSubmitting">
                {{ t('common.create') }} (Cmd+Enter)
              </UButton>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">Workflow readiness</h3>
              </template>
              <div class="space-y-3 text-sm text-gray-600">
                <div class="flex items-start gap-2">
                  <UIcon name="i-heroicons-inbox" class="mt-0.5" />
                  <span>Contact info will be ready for the inbox.</span>
                </div>
                <div class="flex items-start gap-2">
                  <UIcon name="i-heroicons-sparkles" class="mt-0.5" />
                  <span>Status and source help trigger workflows.</span>
                </div>
              </div>
            </UCard>
          </div>
        </UForm>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { z } from 'zod';
import { useDebounceFn } from '@vueuse/core';
import { useSupabaseClient } from '#imports';
import { useWorkspaceStore } from '~/stores/workspace';

definePageMeta({
  layout: 'app'
});

const { t, locale } = useI18n();
const localePath = useLocalePath();
const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const isRtl = computed(() => locale.value === 'he' || locale.value === 'ar');
const workspaceId = computed(() => workspaceStore.activeWorkspaceId);
const isSubmitting = ref(false);

type LeadFormState = {
  company_name: string;
  full_name: string;
  phone: string;
  phone_e164: string;
  language: 'en' | 'he' | 'ar';
  city: string;
  source: 'manual' | 'imported' | 'scraped';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  priority: 'low' | 'normal' | 'high';
  website: string;
  email: string;
  notes: string;
  tags: string[];
  custom_fields_json: string;
};

const CreateLeadSchema = z.object({
  full_name: z.string().trim().min(1),
  company_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  phone_e164: z.string().trim().optional(),
  language: z.enum(['en', 'he', 'ar']),
  city: z.string().trim().optional(),
  source: z.enum(['manual', 'imported', 'scraped']),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  website: z.string().trim().url().optional().or(z.literal('')),
  email: z.string().trim().email().optional().or(z.literal('')),
  notes: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  custom_fields_json: z.string().refine((val) => {
    if (!val.trim()) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  })
});

const state = reactive<LeadFormState>({
  company_name: '',
  full_name: '',
  phone: '',
  phone_e164: '',
  language: 'en',
  city: '',
  source: 'manual',
  status: 'new',
  priority: 'normal',
  website: '',
  email: '',
  notes: '',
  tags: [],
  custom_fields_json: ''
});

const statusOptions = computed(() => [
  { label: t('leads.status.new'), value: 'new' },
  { label: t('leads.status.contacted'), value: 'contacted' },
  { label: t('leads.status.qualified'), value: 'qualified' },
  { label: t('leads.status.proposal'), value: 'proposal' },
  { label: t('leads.status.won'), value: 'won' },
  { label: t('leads.status.lost'), value: 'lost' }
]);

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'עברית', value: 'he' },
  { label: 'العربية', value: 'ar' }
];

const sourceOptions = computed(() => [
  { label: t('leads.sources.manual'), value: 'manual' },
  { label: t('leads.sources.import'), value: 'imported' },
  { label: 'Scraped', value: 'scraped' }
]);

const priorityOptions = computed(() => [
  { label: t('leads.priority.low'), value: 'low' },
  { label: t('leads.priority.normal'), value: 'normal' },
  { label: t('leads.priority.high'), value: 'high' }
]);

const tagOptions = computed(() => state.tags.map((tag) => ({ label: tag, value: tag })));

const statusColor: Record<string, string> = {
  new: 'primary',
  contacted: 'orange',
  qualified: 'blue',
  proposal: 'yellow',
  won: 'green',
  lost: 'red'
};

const priorityColor: Record<string, string> = {
  low: 'neutral',
  normal: 'yellow',
  high: 'red'
};

const statusLabel = computed(() => statusOptions.value.find((option) => option.value === state.status)?.label || state.status);
const priorityLabel = computed(() => priorityOptions.value.find((option) => option.value === state.priority)?.label || state.priority);
const sourceLabel = computed(() => sourceOptions.value.find((option) => option.value === state.source)?.label || state.source);
const languageLabel = computed(() => languageOptions.find((option) => option.value === state.language)?.label || state.language);

const hasDuplicates = ref(false);
const duplicateLeads = ref<Array<any> | null>(null);
const allowSubmissionAnyway = ref(false);
const dedupeLeads = useDebounceFn(async (phone_e164: string) => {
  if (!phone_e164) {
    hasDuplicates.value = false;
    duplicateLeads.value = null;
    return;
  }

  if (!workspaceId.value) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, company_name, phone_e164, status, created_at')
      .eq('workspace_id', workspaceId.value)
      .eq('phone_e164', phone_e164)
      .limit(5);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      hasDuplicates.value = true;
      duplicateLeads.value = data;
      allowSubmissionAnyway.value = false;
    } else {
      hasDuplicates.value = false;
      duplicateLeads.value = null;
    }
  } catch (error: any) {
    console.error('Error checking for duplicates:', error.message);
    toast.add({
      title: t('leads.new.toast.error.title'),
      description: error.message || t('leads.new.toast.error.description'),
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
  }
}, 500);

watch(() => state.phone, (newPhone) => {
  if (!state.phone_e164) {
    state.phone_e164 = newPhone;
  }
});

watch(
  () => state.phone_e164 || state.phone,
  (newPhone) => {
    dedupeLeads(newPhone);
  },
  { immediate: true }
);

const handleSaveShortcut = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    onSubmit({ preventDefault: () => {}, data: state });
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleSaveShortcut);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleSaveShortcut);
});

function mapSourceValue(value: LeadFormState['source']) {
  if (value === 'imported') return 'import';
  if (value === 'scraped') return 'google_maps';
  return value;
}

function mapPriorityValue(value: LeadFormState['priority']) {
  if (value === 'normal') return 'medium';
  return value;
}

async function onSubmit(event: { preventDefault: () => void; data: LeadFormState }) {
  if (!workspaceId.value) {
    toast.add({
      title: t('leads.new.toast.error.title'),
      description: 'Cannot create lead: No active workspace',
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
    return;
  }

  if (hasDuplicates.value && !allowSubmissionAnyway.value) {
    toast.add({
      title: 'Duplicate detected',
      description: 'Review the existing lead or continue anyway.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'warning'
    });
    return;
  }

  if (isSubmitting.value) return;
  isSubmitting.value = true;

  let custom_fields = {};
  if (event.data.custom_fields_json?.trim()) {
    try {
      custom_fields = JSON.parse(event.data.custom_fields_json);
    } catch (error: any) {
      toast.add({
        title: 'Invalid JSON',
        description: error.message || 'Please provide valid JSON.',
        icon: 'i-heroicons-x-circle',
        color: 'error'
      });
      isSubmitting.value = false;
      return;
    }
  }

  try {
    const payload = {
      company_name: event.data.company_name?.trim() || null,
      full_name: event.data.full_name?.trim() || null,
      phone: event.data.phone?.trim() || null,
      phone_e164: (event.data.phone_e164 || event.data.phone || '').trim() || null,
      language: event.data.language,
      city: event.data.city?.trim() || null,
      source: mapSourceValue(event.data.source),
      status: event.data.status,
      priority: mapPriorityValue(event.data.priority),
      website: event.data.website?.trim() || null,
      email: event.data.email?.trim() || null,
      notes: event.data.notes?.trim() || null,
      tags: event.data.tags?.length ? event.data.tags : null,
      custom_fields,
      workspace_id: workspaceId.value
    };

    const { data, error } = await supabase.from('leads').insert(payload).select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const newLead = data[0];
      toast.add({
        title: t('leads.new.toast.success.title'),
        description: t('leads.new.toast.success.description', { company_name: newLead.company_name }),
        icon: 'i-heroicons-check-circle',
        color: 'success'
      });

      await router.push(localePath(`/app/leads/${newLead.id}`));
    }
  } catch (error: any) {
    toast.add({
      title: t('leads.new.toast.error.title'),
      description: error.message || t('leads.new.toast.error.description'),
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
