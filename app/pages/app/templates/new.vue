<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { z } from "zod";
import TemplatePreview from "~/components/templates/TemplatePreview.vue";
import TemplateVariableList from "~/components/templates/TemplateVariableList.vue";

definePageMeta({
  layout: "app",
});

const router = useRouter();
const { t } = useI18n();

const statuses = [
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "active" },
  { label: "Archived", value: "archived" },
];
const channels = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "In-app", value: "in_app" },
];
const categories = [
  { label: "Outreach", value: "outreach" },
  { label: "Follow-up", value: "followup" },
  { label: "Reply", value: "reply" },
  { label: "Qualification", value: "qualification" },
  { label: "Proposal", value: "proposal" },
  { label: "System", value: "system" },
];

const template = reactive({
  title: "",
  key: "",
  channel: channels[0].value,
  status: statuses[0].value,
  category: categories[0].value,
  tags: [] as string[],
  locales: {
    en: { text: "" },
    he: { text: "" },
    ar: { text: "" },
  } as Record<string, { text: string }>,
  variants: {
    default: { text: "" },
  } as Record<string, { text: string }>,
  variables_schema: { type: "object", properties: {} } as Record<string, any>,
  defaults: {} as Record<string, any>,
  rules: {} as Record<string, any>,
  compliance: {
    policy_level: "standard",
    opt_out: {
      required: true,
      text: {
        en: "Reply STOP to opt out",
        he: "׳”׳©׳‘/׳™ STOP ׳׳”׳¡׳¨׳”",
        ar: "״§ƒ״×״¨ STOP „״¥‚״§ ״§„״±״³״§״¦„",
      },
    },
  } as Record<string, any>,
  rulesText: "",
  complianceText: "",
});

const ui = reactive({
  previewLocale: "he",
  previewVariant: "default",
});

const tagInput = ref("");

const addTag = () => {
  const value = tagInput.value.trim();
  if (!value) {
    return;
  }
  if (!template.tags.includes(value)) {
    template.tags.push(value);
  }
  tagInput.value = "";
};

const removeTag = (tag: string) => {
  const index = template.tags.indexOf(tag);
  if (index !== -1) {
    template.tags.splice(index, 1);
  }
};

const schema = z.object({
  title: z.string().min(1),
  key: z.string().min(1),
  channel: z.string().min(1),
  status: z.string().min(1),
  category: z.string().min(1),
  locales: z.record(z.string(), z.object({ text: z.string().optional() })),
  variants: z.record(z.string(), z.object({ text: z.string().optional() })),
});

const derivedLocales = computed(() =>
  Object.keys(template.locales).map((locale) => ({
    label: locale.toUpperCase(),
    value: locale,
  }))
);

const derivedVariants = computed(() =>
  Object.keys(template.variants).map((variant) => ({
    label: variant,
    value: variant,
  }))
);

const previewContent = computed(() => {
  const localeBlock = template.locales[ui.previewLocale]?.text || "";
  const variantBlock = template.variants[ui.previewVariant]?.text || "";
  return [localeBlock, variantBlock].filter(Boolean).join("\n\n");
});

const statusTone = { draft: "neutral", active: "success", archived: "warning" };

const addLocale = () => {
  const localeCode = prompt("Enter locale code (e.g. en, he, ar):");
  if (!localeCode) return;
  if (localeCode in template.locales) {
    toast.add({ title: "Locale already exists", color: "warning" });
    return;
  }
  template.locales[localeCode] = { text: "" };
};

const addVariant = () => {
  const name = prompt("Enter variant name:");
  if (!name) return;
  if (name in template.variants) {
    toast.add({ title: "Variant already exists", color: "warning" });
    return;
  }
  template.variants[name] = { text: "" };
};

const schemaFromVariables = (variables: Record<string, { label: string; example: string }>) => {
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(variables)) {
    props[key] = {
      type: "string",
      title: value.label,
      example: value.example,
    };
  }
  return { type: "object", properties: props };
};

const formState = reactive({
  variables: {} as Record<string, { label: string; example: string }>,
});

watch(
  () => formState.variables,
  (value) => {
    template.variables_schema = schemaFromVariables(value);
    template.defaults = Object.keys(value).reduce<Record<string, any>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
  }
);

const copy = async (value: string) => {
  await navigator.clipboard.writeText(value);
  toast.add({ title: "Copied", color: "success" });
};

const submit = async () => {
  try {
    const payload = {
      title: template.title,
      key: template.key,
      channel: template.channel,
      status: template.status,
      category: template.category,
      locales: template.locales,
      variants: template.variants,
      variables_schema: template.variables_schema,
      defaults: template.defaults,
      rules: template.rules,
      compliance: template.compliance,
      tags: template.tags,
    };
    const data = await $fetch("/api/templates", { method: "POST", body: payload });
    router.push(`/app/templates/${data.id}`);
    toast.add({ title: "Template created", color: "success" });
  } catch (error) {
    toast.add({ title: "Create failed", color: "error" });
  }
};
</script>

<template>
  <UMain>
    <template #header>
      <UContainer>
        <UPageHeader :title="t('templates.new.title')" :description="t('templates.new.subtitle')" />
      </UContainer>
    </template>

    <UContainer>
      <UForm :schema="schema" class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px]" @submit.prevent="submit">
        <div class="space-y-4">
          <UCard>
            <template #header>
              <div class="flex flex-col gap-3">
                <h3 class="text-lg font-semibold">Content Builder</h3>
                <div class="flex flex-wrap items-center gap-3">
                  <UFieldGroup>
                    <UButton
                      v-for="channel in channels"
                      :key="channel.value"
                      :label="channel.label"
                      :color="template.channel === channel.value ? 'primary' : 'neutral'"
                      :variant="template.channel === channel.value ? 'solid' : 'outline'"
                      size="xs"
                      @click="template.channel = channel.value"
                    />
                  </UFieldGroup>
                  <USelectMenu
                    v-model="template.status"
                    :items="statuses"
                    option-attribute="label"
                    value-attribute="value"
                    class="w-full sm:w-48"
                  />
                </div>
              </div>
            </template>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
              <div class="space-y-4">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold">Locales</span>
                    <UButton icon="i-heroicons-language" variant="soft" color="neutral" size="xs" @click="addLocale">
                      Add locale
                    </UButton>
                  </div>
                  <div v-for="(locale, key) in template.locales" :key="key" class="space-y-1">
                    <div class="text-xs text-gray-500">{{ key.toUpperCase() }}</div>
                    <UTextarea v-model="locale.text" :rows="3" class="w-full" />
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold">Variants</span>
                    <UButton icon="i-heroicons-plus" variant="soft" color="neutral" size="xs" @click="addVariant">
                      Add variant
                    </UButton>
                  </div>
                  <div v-for="(variant, key) in template.variants" :key="key" class="space-y-1">
                    <div class="text-xs text-gray-500">{{ key }}</div>
                    <UTextarea v-model="variant.text" :rows="3" class="w-full" />
                  </div>
                </div>
              </div>
              <div>
                <UCard>
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h4 class="text-sm font-semibold">Preview</h4>
                    </div>
                  </template>
                  <div class="space-y-3">
                    <USelectMenu
                      v-model="ui.previewLocale"
                      :items="derivedLocales"
                      placeholder="Locale"
                      size="sm"
                    />
                    <USelectMenu
                      v-model="ui.previewVariant"
                      :items="derivedVariants"
                      placeholder="Variant"
                      size="sm"
                    />
                    <TemplatePreview
                      :body="previewContent"
                      :variables="template.variables_schema"
                      :mock-data="template.defaults"
                      :language="ui.previewLocale"
                    />
                    <div class="flex gap-2">
                      <UButton label="Copy" icon="i-heroicons-clipboard" size="sm" variant="soft" @click="copy(previewContent)" />
                      <UButton label="Test" icon="i-heroicons-play" size="sm" variant="solid" color="primary" />
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Variables & Defaults</h3>
            </template>
            <TemplateVariableList v-model="formState.variables" />
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Rules & Compliance</h3>
            </template>
            <UFormField label="Rules">
              <UTextarea v-model="template.rulesText" :rows="4" class="w-full" />
            </UFormField>
            <UFormField label="Compliance">
              <UTextarea v-model="template.complianceText" :rows="4" class="w-full" />
            </UFormField>
          </UCard>
        </div>

        <div class="space-y-4">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Meta</h3>
            </template>
            <div class="space-y-3">
              <UFormField label="Title">
                <UInput v-model="template.title" class="w-full" />
              </UFormField>
              <UFormField label="Key">
                <UInput v-model="template.key" class="w-full" />
              </UFormField>
              <UFormField label="Category">
                <USelectMenu v-model="template.category" :items="categories" class="w-full" />
              </UFormField>
              <UFormField label="Channel">
                <USelectMenu v-model="template.channel" :items="channels" class="w-full" />
              </UFormField>
              <UFormField label="Status">
                <USelectMenu v-model="template.status" :items="statuses" option-attribute="label" value-attribute="value" class="w-full" />
              </UFormField>
              <UFormField label="Tags">
                <div class="space-y-2">
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="tag in template.tags"
                      :key="tag"
                      class="flex items-center gap-2 rounded-full border border-default bg-muted/50 px-3 py-1 text-xs text-default"
                    >
                      <span>{{ tag }}</span>
                      <button
                        type="button"
                        class="text-xs text-muted transition hover:text-primary focus:outline-none"
                        aria-label="Remove tag"
                        @click="removeTag(tag)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <UInput
                      v-model="tagInput"
                      placeholder="Add a tag"
                      class="w-full"
                      @keydown.enter.prevent="addTag"
                    />
                    <UButton
                      label="Add"
                      size="sm"
                      variant="solid"
                      color="primary"
                      :disabled="!tagInput.trim()"
                      @click="addTag"
                    />
                  </div>
                </div>
              </UFormField>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Status</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Channel</span>
                <span>{{ template.channel }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Status</span>
                <span>{{ template.status }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Category</span>
                <span>{{ template.category }}</span>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Assist</h3>
            </template>
            <div class="flex flex-col gap-2">
              <UButton label="Generate AI draft" icon="i-heroicons-sparkles" variant="soft" color="neutral" />
              <UButton label="Validate" icon="i-heroicons-shield-check" variant="soft" color="neutral" />
            </div>
          </UCard>
        </div>
      </UForm>
    </UContainer>
  </UMain>
</template>

