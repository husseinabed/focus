<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import TemplatePreview from "~/components/templates/TemplatePreview.vue";

const { t } = useI18n();
const route = useRoute();
const templateId = route.params.id as string;

const { data: template, pending, error } = useAsyncData(
  `template-${templateId}`,
  () => $fetch(`/api/templates/${templateId}`)
);

const reservedVariables = [
  "lead.first_name",
  "lead.full_name",
  "lead.company_name",
  "lead.phone",
  "lead.city",
  "lead.language",
  "workspace.name",
  "user.first_name",
];

const combinedVariables = computed(() => {
  const vars = [];
  // Add reserved variables
  reservedVariables.forEach((key) => {
    vars.push({ key, label: key, example: template.value?.mockData?.[key] || "" });
  });
  // Add custom variables
  if (template.value?.variables) {
    for (const key in template.value.variables) {
      if (Object.prototype.hasOwnProperty.call(template.value.variables, key)) {
        vars.push({ key, label: template.value.variables[key].label, example: template.value.variables[key].example });
      }
    }
  }
  return vars;
});

const variableColumns = [
  { key: "key", label: "Variable" },
  { key: "label", label: "Label" },
  { key: "example", label: "Example" },
];

const mockData = {
  "lead.first_name": "Ahmad",
  "lead.company_name": "Ahmad Law Office",
  "lead.city": "Haifa",
  offer: "Free 5-minute audit",
};
</script>

<template>
  <UMain>
    <template #header>
      <UContainer>
        <UPageHeader :title="template?.name || t('templates.detail.title')" :ui="{wrapper: 'border-none', container: 'gap-3'}" />
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

    <UContainer v-else-if="template">
      <div class="space-y-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Template Metadata</h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>Name:</strong> {{ template.name }}</div>
            <div><strong>Category:</strong> <UBadge :label="template.category" color="neutral" variant="soft" /></div>
            <div><strong>Language:</strong> <UBadge :label="template.language" color="neutral" variant="soft" /></div>
            <div><strong>Status:</strong> <UBadge :label="template.is_active ? 'Active' : 'Inactive'" :color="template.is_active ? 'success' : 'error'" variant="soft" /></div>
            <div><strong>Created By:</strong> {{ template.created_by }}</div>
            <div><strong>Created At:</strong> {{ new Date(template.created_at).toLocaleDateString() }}</div>
            <div><strong>Updated At:</strong> {{ new Date(template.updated_at).toLocaleDateString() }}</div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Rendered Preview</h3>
          </template>
          <TemplatePreview
            :body="template.body"
            :variables="template.variables || {}"
            :mock-data="mockData"
            :language="template.language"
          />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Available Variables</h3>
          </template>
          <UTable :rows="combinedVariables" :columns="variableColumns" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Usage Hint</h3>
          </template>
          <p class="text-gray-500 dark:text-gray-400">
            This template can be used in various parts of the application, such as quick replies in the inbox, workflow nodes, and approval previews.
            Variables like <code class="text-primary-500">{{lead.first_name}}</code> will be automatically replaced with data from the specific lead or workspace.
          </p>
          <p class="mt-2">
            <ULink to="/docs/templates" active-class="text-primary" inactive-class="hover:text-primary dark:hover:text-primary">Read more about template usage in the documentation.</ULink>
          </p>
        </UCard>
      </div>
    </UContainer>

    <UContainer v-else>
      <UCard>
        <p>Template not found.</p>
      </UCard>
    </UContainer>
  </UMain>
</template>