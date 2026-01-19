<script setup lang="ts">
import { z, ZodError } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import TriggerConfigForm from '~/components/workflow/TriggerConfigForm.vue';

import {
  manualTriggerSchema,
  leadAddedTriggerSchema,
  inboundReplyTriggerSchema,
  scheduledTriggerSchema
} from '~~/shared/workflowNodeSchemas';
import { computed } from 'vue';

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const ui = {
  form: {
    sections: {
      trigger: {
        preview: {
          root: 'overflow-hidden bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 shadow rounded-lg px-4 py-5 sm:p-6'
        }
      }
    }
  }
};

const form = ref();
const state = ref({
  name: undefined,
  trigger_type: 'manual',
  description: undefined,
  config: {} as Record<string, any>,
});

const baseSchema = z.object({
  name: z.string().min(2, 'Must be at least 2 characters').max(80, 'Must be at most 80 characters'),
  trigger_type: z.enum(['manual', 'lead_added', 'inbound_reply', 'scheduled']),
  description: z.string().max(280, 'Must be at most 280 characters').optional(),
});

// Helper to build Zod schema from our custom schema definition
const buildZodSchema = (configDef: Record<string, any>) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const key in configDef) {
    const field = configDef[key];
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'string':
        fieldSchema = z.string();
        if (field.placeholder) fieldSchema = (fieldSchema as z.ZodString).min(1, field.placeholder); // Basic validation for string
        break;
      case 'enum':
        fieldSchema = z.enum(field.options as [string, ...string[]]);
        break;
      case 'number':
        fieldSchema = z.number();
        if (field.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.min);
        if (field.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.max);
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.any();
    }

    if (field.required === false || field.optional === true) {
      fieldSchema = fieldSchema.optional();
    } else {
      fieldSchema = fieldSchema.default(field.default);
    }
    shape[key] = fieldSchema;
  }
  return z.object(shape);
};

const dynamicConfigSchema = z.discriminatedUnion('trigger_type', [
  baseSchema.extend({
    trigger_type: z.literal('manual'),
    config: buildZodSchema({}),
  }),
  baseSchema.extend({
    trigger_type: z.literal('lead_added'),
    config: buildZodSchema(leadAddedTriggerSchema.config),
  }),
  baseSchema.extend({
    trigger_type: z.literal('inbound_reply'),
    config: buildZodSchema(inboundReplyTriggerSchema.config),
  }),
  baseSchema.extend({
    trigger_type: z.literal('scheduled'),
    config: buildZodSchema(scheduledTriggerSchema.config),
  }),
]);

const schema = toTypedSchema(dynamicConfigSchema);

const triggerSchemaMap = {
  manual: manualTriggerSchema,
  lead_added: leadAddedTriggerSchema,
  inbound_reply: inboundReplyTriggerSchema,
  scheduled: scheduledTriggerSchema,
};

type WorkflowTriggerType = 'manual' | 'lead_added' | 'inbound_reply' | 'scheduled';

const currentSchema = computed(() => {
  const type = state.value.trigger_type as WorkflowTriggerType;
  return triggerSchemaMap[type] || {};
});

import { useAuth } from '~/composables/useAuth';
import { useWorkspaceStore } from '~/stores/workspace';

import type { Database, Tables, TablesInsert } from '~/types/supabase';

const loading = ref(false);
const error = ref<string | null>(null);
const supabase = useSupabaseClient<Database>();
const auth = useAuth();
const workspaceStore = useWorkspaceStore();

const submit = async () => {
 
  loading.value = true;
  try {
    const activeWorkspaceId = workspaceStore.activeWorkspaceId;
    const uid = auth.user.value?.sub;

    if (!activeWorkspaceId || !uid) {
      error.value = 'Failed to create workflow: You must be logged in and have an active workspace selected.';
      console.error('Missing activeWorkspaceId or user ID', { activeWorkspaceId, uid });
 
      return;
    }

 
    const v1_graph_minimal = {
      schema_version: 1,
      nodes: [
        {
          id: 'trigger',
          type: 'trigger-manual', // Type must be 'trigger' for the initial node as per task
          position: { x: 80, y: 120 }, // As per task
          data: {
            label: "Trigger",
            config: {
              trigger_type: state.value.trigger_type,
              ...state.value.config,
            }
          },
        },
      ],
      edges: [],
    };

    console.log('Attempting to insert workflow...');
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .insert(
        {
          workspace_id: activeWorkspaceId,
          name: state.value.name!,
          description: state.value.description,
          trigger_type: state.value.trigger_type,
          is_active: true,
          created_by: uid,
        } as TablesInsert<'workflows'>
      )
      .select()
      .single<Tables<'workflows'>>();

    if (workflowError) {
      console.error('Workflow insertion error:', workflowError);
      error.value = workflowError.message;
      return;
    }

    if (!workflowData) {
      error.value = 'Failed to create workflow';
      return;
    }

 
    const workflowId = workflowData.id;
 
    const { error: versionError } = await supabase
      .from('workflow_versions')
      .insert(
        {
          workflow_id: workflowId,
          version: 1,
          schema_version: 1,
          published: false,
          graph: v1_graph_minimal as TablesInsert<'workflow_versions'>['graph'],
          created_by: uid,
        } as TablesInsert<'workflow_versions'>
      );

    if (versionError) {
      console.error('Workflow version insertion error:', versionError);
      error.value = versionError.message;
      return;
    }

    console.log('Workflow version inserted successfully.');
    error.value = null; // Clear any previous errors
    navigateTo(`/app/workflows/${workflowId}/edit`);
  } catch (e) {
    error.value = (e as Error).message || 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UContainer class="centered_container max-w-2xl space-y-4">
    <UCard>
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">{{ $t('workflows.new.title') }}</h1>
          <p class="text-gray-500 dark:text-gray-400">{{ $t('workflows.new.subtitle') }}</p>
        </div>
        <UButton
          icon="i-heroicons-arrow-left"
          :label="$t('common.back')"
          to="/app/workflows"
          color="neutral"
          variant="ghost"
        />
      </div>

      <USeparator class="my-4" />

      <UAlert
        v-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        :title="$t('common.error')"
        :description="error"
        class="mb-4"
        :close-button="{
          icon: 'i-heroicons-x-mark-20-solid',
          color: 'error',
          variant: 'link',
          padded: false,
        }"
      />

      <UForm
        ref="form"
        :state="state"
        class="space-y-4 w-full flex flex-col"
        @submit="submit"
      >
        <!-- Basic Information Section -->
        <UCard :ui="ui.form.sections.trigger.preview">
          <template #header>
            <h3 class="text-lg font-semibold">{{ $t('workflows.new.sections.basic') }}</h3>
          </template>
          <UFormField
            :label="$t('workflows.fields.name')"
            name="name"
            required
          >
            <UInput
              class="w-full"
              :placeholder="$t('workflows.fields.name_placeholder')"
              v-model="state.name"
            />
          </UFormField>

          <UFormField
            :label="$t('workflows.fields.description')"
            name="description"
          >
            <UTextarea
              class="w-full"
              :placeholder="$t('workflows.fields.description_placeholder')"
              :rows="4"
              v-model="state.description"
            />
          </UFormField>
        </UCard>

        <!-- Trigger Configuration Section -->
        <UCard :ui="ui.form.sections.trigger.preview">
          <template #header>
            <h3 class="text-lg font-semibold">{{ $t('workflows.new.sections.trigger') }}</h3>
          </template>
          <UFormField
            :label="$t('workflows.fields.trigger_type')"
            :hint="$t('workflows.trigger.hint')"
            name="trigger_type"
            required
          >
            <USelect
              class="w-full"
              :items="[
                { value: 'manual', label: $t('workflows.trigger.manual') },
                { value: 'lead_added', label: $t('workflows.trigger.lead_added') },
                { value: 'inbound_reply', label: $t('workflows.trigger.inbound_reply') },
                { value: 'scheduled', label: $t('workflows.trigger.scheduled') },
              ]"
              v-model="state.trigger_type"
            />
          </UFormField>

          <TriggerConfigForm
            v-if="state.trigger_type && currentSchema.config && Object.keys(currentSchema.config).length > 0"
            :trigger-type="(state.trigger_type as 'manual' | 'lead_added' | 'inbound_reply' | 'scheduled')"
            v-model:config="state.config"
          />
        </UCard>

        <!-- Trigger Preview Section -->
        <UCard
          v-if="state.trigger_type"
          class="col-span-1"
          :ui="ui.form.sections.trigger.preview"
        >
          <template #header>
            <h3 class="text-lg font-semibold">{{ $t('workflows.new.preview.title') }}</h3>
          </template>
          <p class="text-gray-500 dark:text-gray-400">
            {{ $t(`workflows.new.preview.trigger.${state.trigger_type}`) }}
            <span v-if="state.trigger_type === 'lead_added' && state.config.source">
              - {{ $t('workflow.nodes.trigger.lead_added.source') }}: {{ $t(`workflow.nodes.trigger.lead_added.source.${state.config.source}`) }}
            </span>
            <span v-if="state.trigger_type === 'lead_added' && state.config.min_priority">
              - {{ $t('workflow.nodes.trigger.lead_added.min_priority') }}: {{ state.config.min_priority }}
            </span>
            <span v-if="state.trigger_type === 'inbound_reply' && state.config.inbox_id">
              - {{ $t('workflow.nodes.trigger.inbound_reply.inbox_id') }}: {{ state.config.inbox_id }}
            </span>
            <span v-if="state.trigger_type === 'inbound_reply' && state.config.keywords">
              - {{ $t('workflow.nodes.trigger.inbound_reply.keywords') }}: {{ state.config.keywords }}
            </span>
            <span v-if="state.trigger_type === 'scheduled' && state.config.cron_expression">
              - {{ $t('workflow.nodes.trigger.scheduled.cron_expression') }}: {{ state.config.cron_expression }}
            </span>
          </p>
        </UCard>

        <UFieldGroup
          :ui="{ wrapper: 'mt-6' }"
          description="A description for the field."
        >
          <template #description>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t("workflows.new.trust_note") }}
            </p>
          </template>
        </UFieldGroup>

        <div class="flex justify-end gap-2">
          <UButton
            :label="$t('common.cancel')"
            color="neutral"
            variant="ghost"
            to="/app/workflows"
          />
          <UButton
            type="submit"
            :label="$t('workflows.new.actions.create')"
            :loading="loading"
          />
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>
