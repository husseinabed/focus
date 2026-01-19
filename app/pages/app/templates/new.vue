<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { z } from 'zod';
import { useI18n } from "vue-i18n";

import TemplateEditor from "~/components/templates/TemplateEditor.vue";
import TemplatePreview from "~/components/templates/TemplatePreview.vue";
import TemplateVariableList from "~/components/templates/TemplateVariableList.vue";

const { t } = useI18n();
const router = useRouter();

const categories = ["outreach", "followup", "reply", "qualification", "proposal"];
const languages = ["auto", "he", "ar", "en"];

const state = ref({
  name: undefined,
  category: undefined,
  language: "auto",
  body: undefined,
  variables: {},
  is_active: true,
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  language: z.string().min(1, "Language is required"),
  body: z.string().min(1, "Body is required"),
  variables: z.record(z.string(), z.object({ label: z.string(), example: z.string() })).optional(),
  is_active: z.boolean().optional(),
});

const mockData = {
  "lead.first_name": "Ahmad",
  "lead.company_name": "Ahmad Law Office",
  "lead.city": "Haifa",
  offer: "Free 5-minute audit",
};

async function onSubmit() {
  try {
    await $fetch("/api/templates", {
      method: "POST",
      body: state.value,
    });
    router.push("/app/templates");
    // TODO: Show success notification
  } catch (error) {
    console.error("Error creating template:", error);
    // TODO: Show error notification
  }
}
</script>

<template>
  <UMain>
    <template #header>
      <UContainer>
        <UPageHeader :title="t('templates.new.title')" :ui="{wrapper: 'border-none', container: 'gap-3'}" />
      </UContainer>
    </template>

    <UContainer>
      <UCard>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" class="w-full" />
          </UFormField>

          <UFormField label="Category" name="category" required>
            <USelectMenu v-model="state.category" :options="categories" class="w-full" />
          </UFormField>

          <UFormField label="Language" name="language">
            <USelectMenu v-model="state.language" :options="languages" class="w-full" />
          </UFormField>

          <UFormField label="Body" name="body" required>
            <TemplateEditor v-model="state.body" :language="state.language" :variables="state.variables" />
          </UFormField>

          <UFormField label="Custom Variables" name="variables" description="Define custom variables with label + example">
            <TemplateVariableList v-model="state.variables" />
          </UFormField>

          <UFormField label="Is Active" name="is_active">
            <UToggle v-model="state.is_active" />
          </UFormField>

          <USeparator />

          <UCard>
            <template #header>
              <h3 class="font-semibold">Preview</h3>
            </template>
            <TemplatePreview
              :body="state.body || ''"
              :variables="state.variables"
              :mock-data="mockData"
              :language="state.language"
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
              label="Create Template"
              color="primary"
              variant="solid"
            />
          </div>
        </UForm>
      </UCard>
    </UContainer>
  </UMain>
</template>