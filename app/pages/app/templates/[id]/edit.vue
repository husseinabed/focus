<script setup lang="ts">
import { ref, watch } from "vue";
import { z } from 'zod';
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

 

import TemplateEditor from "~/components/templates/TemplateEditor.vue";
import TemplatePreview from "~/components/templates/TemplatePreview.vue";
import TemplateVariableList from "~/components/templates/TemplateVariableList.vue";
import type { Template } from "~/types/templates";


definePageMeta({
  layout: 'app',
});

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const templateId = route.params.id as string;

const categories = ["outreach", "followup", "reply", "qualification", "proposal", "system"];
const channels = ["whatsapp", "sms", "email", "in_app"];
const statuses = [
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "active" },
  { label: "Archived", value: "archived" },
];
const languages = ["he", "ar", "en"];

const state = ref({
  title: "",
  key: "",
  category: categories[0],
  channel: channels[0],
  status: statuses[0].value,
  language: "en",
  body: "",
  variables: {} as Record<string, { label: string; example: string }>,
});

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  key: z.string().min(1, "Key is required"),
  category: z.string().min(1, "Category is required"),
  channel: z.string().min(1, "Channel is required"),
  status: z.string().min(1, "Status is required"),
  language: z.string().min(1, "Language is required"),
  body: z.string().min(1, "Body is required"),
  variables: z.record(z.string(), z.object({ label: z.string(), example: z.string() })).optional(),
});

const mockData = {
  "lead.first_name": "Ahmad",
  "lead.company_name": "Ahmad Law Office",
  "lead.city": "Haifa",
  offer: "Free 5-minute audit",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

watch(
  () => state.value.title,
  (title) => {
    if (!state.value.key) {
      state.value.key = slugify(title);
    }
  }
);

const { data: templateData, pending, error } = useAsyncData<Template>(
  `template-${templateId}`,
  () => $fetch(`/api/templates/${templateId}`)
);

const resolveLocale = (locales: Record<string, any>, preferred?: string) => {
  if (preferred && preferred in locales) return preferred;
  const keys = Object.keys(locales || {});
  return keys.length > 0 ? keys[0] : "en";
};

const resolveBody = (locales: Record<string, any>, language: string) => {
  const entry = locales?.[language];
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry.body || "";
};

const variablesFromSchema = (schemaValue: Record<string, any> | undefined) => {
  const props = schemaValue?.properties;
  if (!props || typeof props !== "object") return {};
  const mapped: Record<string, { label: string; example: string }> = {};
  for (const [key, value] of Object.entries(props)) {
    const entry = value as Record<string, any>;
    mapped[key] = {
      label: typeof entry?.title === "string" ? entry.title : key,
      example: typeof entry?.example === "string" ? entry.example : "",
    };
  }
  return mapped;
};

const schemaFromVariables = (variables: Record<string, any>) => {
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(variables || {})) {
    const entry = value as Record<string, any>;
    props[key] = {
      type: "string",
      title: typeof entry?.label === "string" ? entry.label : key,
      example: typeof entry?.example === "string" ? entry.example : "",
    };
  }
  return { type: "object", properties: props };
};

watch(
  templateData,
  (newVal) => {
    if (!newVal) return;
    const locale = resolveLocale(newVal.locales || {});
    state.value = {
      title: newVal.title || "",
      key: newVal.key || "",
      category: newVal.category || categories[0],
      channel: newVal.channel || channels[0],
      status: newVal.status || statuses[0].value,
      language: locale,
      body: resolveBody(newVal.locales || {}, locale),
      variables: variablesFromSchema(newVal.variables_schema),
    };
  },
  { immediate: true }
);

async function onSubmit() {
  try {
    const existingLocales = templateData.value?.locales || {};
    const locales = {
      ...existingLocales,
      [state.value.language]: {
        ...(typeof existingLocales[state.value.language] === "object"
          ? existingLocales[state.value.language]
          : {}),
        body: state.value.body,
      },
    };

    await $fetch(`/api/templates/${templateId}`, {
      method: "PUT",
      body: {
        title: state.value.title,
        key: state.value.key,
        category: state.value.category,
        channel: state.value.channel,
        status: state.value.status,
        locales,
        variables_schema: schemaFromVariables(state.value.variables),
      },
    });
    router.push("/app/templates");
    // TODO: Show success notification
  } catch (err) {
    console.error("Error updating template:", err);
    // TODO: Show error notification
  }
}
</script>

<template>
  <UMain>
    <template #header>
      <UContainer>
        <UPageHeader :title="t('templates.edit.title')" :ui="{wrapper: 'border-none', container: 'gap-3'}" />
      </UContainer>
    </template>

    <UContainer v-if="pending">
      <UCard>
        <p>Loading template...</p>
      </UCard>
    </UContainer>

    <UContainer v-else-if="error">
      <UCard>
        <p class="text-red-500">Error loading template: {{ error.message }}</p>
      </UCard>
    </UContainer>

    <UContainer v-else-if="state.id">
      <UCard>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Title" name="title" required>
            <UInput v-model="state.title" class="w-full" />
          </UFormField>

          <UFormField label="Key" name="key" required>
            <UInput v-model="state.key" class="w-full" />
          </UFormField>

          <UFormField label="Category" name="category" required>
            <USelectMenu v-model="state.category" :items="categories" class="w-full" />
          </UFormField>

          <UFormField label="Channel" name="channel" required>
            <USelectMenu v-model="state.channel" :items="channels" class="w-full" />
          </UFormField>

          <UFormField label="Status" name="status" required>
            <USelectMenu
              v-model="state.status"
              :items="statuses"
              option-attribute="label"
              value-attribute="value"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Language" name="language">
            <USelectMenu v-model="state.language" :items="languages" class="w-full" />
          </UFormField>

          <UFormField label="Body" name="body" required>
            <TemplateEditor v-model="state.body" :language="state.language" :variables="state.variables" />
          </UFormField>

          <UFormField label="Custom Variables" name="variables" description="Define custom variables with label + example">
            <TemplateVariableList v-model="state.variables" />
          </UFormField>

          <USeparator />

          <UCard>
            <template #header>
              <h3 class="font-semibold">Preview</h3>
            </template>
          <TemplatePreview
            :body="state.body || ''"
            :variables="state.variables || {}"
            :mock-data="mockData"
            :language="state.language || 'en'"
          />
          </UCard>

          <div class="flex justify-end gap-3">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="router.push('/app/templates')"
            />
            <UButton
              type="submit"
              label="Save Template"
              color="primary"
              variant="solid"
            />
          </div>
        </UForm>
      </UCard>
    </UContainer>

    <UContainer v-else>
      <UCard>
        <p>Template not found.</p>
      </UCard>
    </UContainer>
  </UMain>
</template>
