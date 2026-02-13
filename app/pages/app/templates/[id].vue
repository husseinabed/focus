<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useClipboard } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { Template } from "~/types/templates";
import TemplatePreview from "~/components/templates/TemplatePreview.vue";

definePageMeta({
  layout: "app",
});

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const toast = useToast();
const { copy } = useClipboard();

const templateId = route.params.id as string;
const isRtl = computed(() => locale.value === "he" || locale.value === "ar");

const { data: template, pending, error, refresh } = useAsyncData<Template>(
  `template-${templateId}`,
  () => $fetch(`/api/templates/${templateId}`)
);

const ui = ref({
  previewLocale: "",
  previewVariant: "",
  tab: "locales",
  testDrawerOpen: false,
  detailsDrawerOpen: false,
  testVariables: {} as Record<string, string>,
  testRendered: "",
});

const toneByChannel: Record<string, string> = {
  whatsapp: "success",
  email: "primary",
  sms: "neutral",
  in_app: "neutral",
};

const toneByStatus: Record<string, string> = {
  draft: "neutral",
  active: "success",
  archived: "warning",
};

const statusLabel = (status?: string) => {
  if (status === "active") return "Approved";
  if (status === "archived") return "Archived";
  return "Draft";
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed);
};

const renderTemplate = (content: string, vars: Record<string, any>) =>
  content.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const value = vars[key.trim()];
    if (value === undefined || value === null) return "";
    return String(value);
  });

const flattenVariablesSchema = (schema?: Record<string, any>) => {
  const props = schema?.properties;
  const required = new Set(schema?.required || []);
  if (!props || typeof props !== "object") return [];
  return Object.entries(props).map(([name, value]) => {
    const entry = value as Record<string, any>;
    return {
      name,
      type: entry?.type || "string",
      required: required.has(name),
      example: entry?.example || entry?.examples?.[0] || "",
    };
  });
};

const derivedLocales = computed(() =>
  Object.keys(template.value?.locales || {}).map((value) => ({ label: value.toUpperCase(), value }))
);

const derivedVariants = computed(() =>
  Object.keys(template.value?.variants || {}).map((value) => ({ label: value, value }))
);

const currentLocale = computed(() => {
  const available = derivedLocales.value.map((item) => item.value);
  if (ui.value.previewLocale && available.includes(ui.value.previewLocale)) return ui.value.previewLocale;
  return available[0] ?? "en";
});

const currentVariant = computed(() => {
  const available = derivedVariants.value.map((item) => item.value);
  if (ui.value.previewVariant && available.includes(ui.value.previewVariant)) return ui.value.previewVariant;
  return available[0] ?? "";
});

const resolveBody = (localeKey: string) => {
  const entry = template.value?.locales?.[localeKey];
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry.body || entry.text || "";
};

const resolveVariantBody = (variantKey: string) => {
  const entry = template.value?.variants?.[variantKey];
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry.body || entry.text || "";
};

const derivedRaw = computed(() => {
  const base = resolveBody(currentLocale.value);
  const variant = currentVariant.value ? resolveVariantBody(currentVariant.value) : "";
  return [base, variant].filter(Boolean).join("\n\n");
});

const previewMockData = computed(() => template.value?.defaults || {});
const previewRendered = computed(() => renderTemplate(derivedRaw.value, previewMockData.value));
const mergedTestData = computed(() => ({ ...previewMockData.value, ...ui.value.testVariables }));

const derivedVariables = computed(() => flattenVariablesSchema(template.value?.variables_schema));

const derivedUsage = computed(() => ({
  workflowsCount: template.value?.usage?.workflowsCount ?? 0,
  lastUsedAt: template.value?.usage?.lastUsedAt ?? null,
}));

const variablesMap = computed(() => {
  const props = template.value?.variables_schema?.properties;
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
});

const testFields = computed(() =>
  derivedVariables.value.map((variable) => ({
    ...variable,
    value: ui.value.testVariables[variable.name] ?? previewMockData.value[variable.name] ?? "",
  }))
);

const tabs = [
  { label: "Locales", value: "locales" },
  { label: "Variants", value: "variants" },
  { label: "Variables", value: "variables" },
  { label: "Rules", value: "rules" },
];

const jsonBlock = (value: any) => JSON.stringify(value ?? {}, null, 2);

const copyRendered = async () => {
  await copy(previewRendered.value);
  toast.add({ title: "Rendered content copied", color: "success" });
};

const openTestDrawer = () => {
  ui.value.testDrawerOpen = true;
};

const runTestRender = () => {
  ui.value.testRendered = renderTemplate(derivedRaw.value, mergedTestData.value);
};

const exportTemplate = async () => {
  const response = await $fetch(`/api/templates/${templateId}/export`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `template-${templateId}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const duplicateTemplate = async () => {
  if (!template.value) return;
  await $fetch("/api/templates", {
    method: "POST",
    body: {
      title: `${template.value.title} (Copy)`,
      key: `${template.value.key}-copy`,
      category: template.value.category,
      channel: template.value.channel,
      status: template.value.status,
      locales: template.value.locales,
      variants: template.value.variants,
      variables_schema: template.value.variables_schema,
      defaults: template.value.defaults,
      rules: template.value.rules,
      compliance: template.value.compliance,
      tags: template.value.tags,
    },
  });
  toast.add({ title: "Template duplicated", color: "success" });
};

const setStatus = async (status: string) => {
  await $fetch(`/api/templates/${templateId}`, {
    method: "PUT",
    body: { status },
  });
  toast.add({ title: "Status updated", color: "success" });
  refresh();
};

const deleteTemplate = async () => {
  if (!confirm("Delete this template?")) return;
  await $fetch(`/api/templates/${templateId}`, { method: "DELETE" });
  toast.add({ title: "Template deleted", color: "success" });
  router.push("/app/templates");
};

watch(
  () => template.value,
  (value) => {
    if (!value) return;
    const availableLocales = derivedLocales.value.map((item) => item.value);
    const availableVariants = derivedVariants.value.map((item) => item.value);
    const nextLocale = availableLocales.includes(ui.value.previewLocale)
      ? ui.value.previewLocale
      : availableLocales[0];
    const nextVariant = availableVariants.includes(ui.value.previewVariant)
      ? ui.value.previewVariant
      : availableVariants[0];
    ui.value.previewLocale = nextLocale ?? "en";
    ui.value.previewVariant = nextVariant ?? "";
    ui.value.testVariables = { ...(value.defaults || {}) };
    ui.value.testRendered = previewRendered.value;
  },
  { immediate: true }
);

watch(
  () => [ui.value.previewLocale, ui.value.previewVariant, previewMockData.value],
  () => {
    ui.value.testRendered = previewRendered.value;
  }
);

const complianceFields = computed(() => {
  const compliance = template.value?.compliance || {};
  return [
    { key: "policy_level", label: "Policy level", value: compliance.policy_level },
    { key: "risk_flags", label: "Risk flags", value: compliance.risk_flags },
    { key: "notes", label: "Notes", value: compliance.notes },
    { key: "blocked_phrases", label: "Blocked phrases", value: compliance.blocked_phrases },
    { key: "required_disclaimers", label: "Required disclaimers", value: compliance.required_disclaimers },
    { key: "opt_out", label: "Opt out", value: compliance.opt_out },
  ].filter((item) => item.value !== undefined && item.value !== null);
});
</script>
<template>
  <UMain :dir="isRtl ? 'rtl' : 'ltr'">
    <template #header>
      <UContainer>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                v-if="template?.channel"
                :color="toneByChannel[template.channel] || 'neutral'"
                variant="subtle"
                :label="template.channel"
              />
              <UBadge
                v-if="template?.status"
                :color="toneByStatus[template.status] || 'neutral'"
                variant="subtle"
                :label="statusLabel(template.status)"
              />
              <UBadge
                v-if="template?.category"
                color="neutral"
                variant="subtle"
                :label="template.category"
              />
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ template?.title || "Template" }}
              </h1>
              <p class="text-sm text-gray-500">{{ template?.key }}</p>
            </div>
            <div v-if="template?.tags?.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="tag in template.tags"
                :key="tag"
                color="neutral"
                variant="subtle"
                :label="tag"
              />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              label="Edit"
              icon="i-heroicons-pencil-square"
              color="primary"
              :to="`/app/templates/${templateId}/edit`"
            />
            <UButton
              label="Duplicate"
              icon="i-heroicons-document-duplicate"
              color="neutral"
              variant="soft"
              @click="duplicateTemplate"
            />
            <UButton
              label="Export JSON"
              icon="i-heroicons-arrow-down-tray"
              color="neutral"
              variant="soft"
              @click="exportTemplate"
            />
            <UDropdownMenu
              :items="[
                template?.status !== 'archived'
                  ? { label: 'Archive', icon: 'i-heroicons-archive-box', onSelect: () => setStatus('archived') }
                  : { label: 'Restore', icon: 'i-heroicons-arrow-uturn-left', onSelect: () => setStatus('draft') },
                { label: 'Delete', icon: 'i-heroicons-trash', onSelect: deleteTemplate },
              ]"
            >
              <UButton
                label="More"
                color="neutral"
                variant="outline"
                trailing-icon="i-heroicons-chevron-down"
              />
            </UDropdownMenu>
            <UButton
              label="Details"
              icon="i-heroicons-sliders-horizontal"
              color="neutral"
              variant="outline"
              class="lg:hidden"
              @click="ui.detailsDrawerOpen = true"
            />
          </div>
        </div>
      </UContainer>
    </template>

    <UContainer>
      <UCard v-if="pending">
        <div class="py-8 text-sm text-gray-500">Loading template...</div>
      </UCard>
      <UCard v-else-if="error">
        <div class="py-8 text-sm text-gray-500">Failed to load template.</div>
      </UCard>
      <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div class="space-y-4">
          <UCard>
            <template #header>
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-lg font-semibold">Preview</h3>
                  <div class="flex items-center gap-2">
                    <UButton
                      label="Copy"
                      icon="i-heroicons-clipboard"
                      color="neutral"
                      variant="soft"
                      @click="copyRendered"
                    />
                    <UButton
                      label="Test render"
                      icon="i-heroicons-play"
                      color="primary"
                      variant="soft"
                      @click="openTestDrawer"
                    />
                  </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <UFieldGroup>
                    <UButton
                      v-for="item in derivedLocales"
                      :key="item.value"
                      :label="item.label"
                      :color="currentLocale === item.value ? 'primary' : 'neutral'"
                      :variant="currentLocale === item.value ? 'solid' : 'outline'"
                      size="xs"
                      @click="ui.previewLocale = item.value"
                    />
                  </UFieldGroup>
                  <div class="flex items-center gap-2">
                    <USelectMenu
                      v-model="ui.previewVariant"
                      :items="derivedVariants"
                      placeholder="Variant"
                      class="w-full sm:w-56"
                    />
                  </div>
                </div>
              </div>
            </template>
            <TemplatePreview
              :body="derivedRaw"
              :variables="variablesMap"
              :mock-data="previewMockData"
              :language="currentLocale"
            />
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-semibold">Content</h3>
              </div>
            </template>
            <UTabs v-model="ui.tab" :items="tabs" class="mb-4" />
            <div v-if="ui.tab === 'locales'" class="space-y-3">
              <UButton
                label="Copy JSON"
                icon="i-heroicons-clipboard"
                color="neutral"
                variant="soft"
                @click="copy(jsonBlock(template?.locales))"
              />
              <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto">{{ jsonBlock(template?.locales) }}</pre>
            </div>
            <div v-else-if="ui.tab === 'variants'" class="space-y-3">
              <UButton
                label="Copy JSON"
                icon="i-heroicons-clipboard"
                color="neutral"
                variant="soft"
                @click="copy(jsonBlock(template?.variants))"
              />
              <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto">{{ jsonBlock(template?.variants) }}</pre>
            </div>
            <div v-else-if="ui.tab === 'variables'" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <UCard>
                <template #header>
                  <h4 class="font-semibold">Schema</h4>
                </template>
                <UButton
                  label="Copy JSON"
                  icon="i-heroicons-clipboard"
                  color="neutral"
                  variant="soft"
                  @click="copy(jsonBlock(template?.variables_schema))"
                />
                <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto mt-3">{{ jsonBlock(template?.variables_schema) }}</pre>
              </UCard>
              <UCard>
                <template #header>
                  <h4 class="font-semibold">Defaults</h4>
                </template>
                <UButton
                  label="Copy JSON"
                  icon="i-heroicons-clipboard"
                  color="neutral"
                  variant="soft"
                  @click="copy(jsonBlock(template?.defaults))"
                />
                <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto mt-3">{{ jsonBlock(template?.defaults) }}</pre>
              </UCard>
            </div>
            <div v-else class="space-y-4">
              <UCard>
                <template #header>
                  <h4 class="font-semibold">Rules</h4>
                </template>
                <UButton
                  label="Copy JSON"
                  icon="i-heroicons-clipboard"
                  color="neutral"
                  variant="soft"
                  @click="copy(jsonBlock(template?.rules))"
                />
                <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto mt-3">{{ jsonBlock(template?.rules) }}</pre>
              </UCard>
              <UCard>
                <template #header>
                  <h4 class="font-semibold">Compliance</h4>
                </template>
                <UButton
                  label="Copy JSON"
                  icon="i-heroicons-clipboard"
                  color="neutral"
                  variant="soft"
                  @click="copy(jsonBlock(template?.compliance))"
                />
                <pre class="text-xs bg-default border border-default rounded-lg p-4 overflow-auto mt-3">{{ jsonBlock(template?.compliance) }}</pre>
              </UCard>
            </div>
          </UCard>
        </div>

        <aside class="hidden lg:block space-y-4">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Status</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Channel</span>
                <UBadge :label="template?.channel" color="neutral" variant="subtle" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Status</span>
                <UBadge
                  :label="statusLabel(template?.status)"
                  :color="toneByStatus[template?.status || 'draft']"
                  variant="subtle"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Category</span>
                <span>{{ template?.category }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Key</span>
                <span class="font-mono text-xs">{{ template?.key }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Updated</span>
                <span class="text-gray-500">{{ formatDate(template?.updated_at) }}</span>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <UButton label="Set Draft" color="neutral" variant="soft" @click="setStatus('draft')" />
              <UButton label="Set Approved" color="neutral" variant="soft" @click="setStatus('active')" />
              <UButton label="Set Archived" color="neutral" variant="soft" @click="setStatus('archived')" />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Variables</h3>
            </template>
            <div class="space-y-3">
              <div v-for="variable in derivedVariables" :key="variable.name" class="rounded-lg border border-default p-3">
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ variable.name }}</span>
                  <UBadge
                    :label="variable.required ? 'Required' : 'Optional'"
                    :color="variable.required ? 'warning' : 'neutral'"
                    variant="subtle"
                  />
                </div>
                <div class="mt-2 text-xs text-gray-500">Type: {{ variable.type }}</div>
                <div v-if="variable.example" class="mt-2 text-xs">Example: {{ variable.example }}</div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Compliance</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div v-for="item in complianceFields" :key="item.key" class="space-y-1">
                <div class="text-xs text-gray-500">{{ item.label }}</div>
                <div class="whitespace-pre-wrap text-sm">{{ item.value }}</div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Usage</h3>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Used in workflows</span>
                <span>{{ derivedUsage.workflowsCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">Last used</span>
                <span class="text-gray-500">{{ derivedUsage.lastUsedAt ? formatDate(derivedUsage.lastUsedAt) : '—' }}</span>
              </div>
            </div>
            <UButton
              label="Find workflows"
              color="neutral"
              variant="soft"
              class="mt-4 w-full"
              :to="`/app/workflows?template=${templateId}`"
            />
          </UCard>
        </aside>
      </div>
    </UContainer>

    <UDrawer v-model:open="ui.detailsDrawerOpen" class="lg:hidden">
      <template #content>
        <UCard class="flex h-full flex-col">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Details</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="ui.detailsDrawerOpen = false" />
            </div>
          </template>
          <div class="flex-1 space-y-4 overflow-y-auto p-4">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Status</h3>
              </template>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Channel</span>
                  <UBadge :label="template?.channel" color="neutral" variant="subtle" />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Status</span>
                  <UBadge
                    :label="statusLabel(template?.status)"
                    :color="toneByStatus[template?.status || 'draft']"
                    variant="subtle"
                  />
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Category</span>
                  <span>{{ template?.category }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Key</span>
                  <span class="font-mono text-xs">{{ template?.key }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Updated</span>
                  <span class="text-gray-500">{{ formatDate(template?.updated_at) }}</span>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <UButton label="Set Draft" color="neutral" variant="soft" @click="setStatus('draft')" />
                <UButton label="Set Approved" color="neutral" variant="soft" @click="setStatus('active')" />
                <UButton label="Set Archived" color="neutral" variant="soft" @click="setStatus('archived')" />
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Variables</h3>
              </template>
              <div class="space-y-3">
                <div v-for="variable in derivedVariables" :key="variable.name" class="rounded-lg border border-default p-3">
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ variable.name }}</span>
                    <UBadge
                      :label="variable.required ? 'Required' : 'Optional'"
                      :color="variable.required ? 'warning' : 'neutral'"
                      variant="subtle"
                    />
                  </div>
                  <div class="mt-2 text-xs text-gray-500">Type: {{ variable.type }}</div>
                  <div v-if="variable.example" class="mt-2 text-xs">Example: {{ variable.example }}</div>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Compliance</h3>
              </template>
              <div class="space-y-3 text-sm">
                <div v-for="item in complianceFields" :key="item.key" class="space-y-1">
                  <div class="text-xs text-gray-500">{{ item.label }}</div>
                  <div class="whitespace-pre-wrap text-sm">{{ item.value }}</div>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Usage</h3>
              </template>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Used in workflows</span>
                  <span>{{ derivedUsage.workflowsCount }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Last used</span>
                  <span class="text-gray-500">{{ derivedUsage.lastUsedAt ? formatDate(derivedUsage.lastUsedAt) : '—' }}</span>
                </div>
              </div>
              <UButton
                label="Find workflows"
                color="neutral"
                variant="soft"
                class="mt-4 w-full"
                :to="`/app/workflows?template=${templateId}`"
              />
            </UCard>
          </div>
        </UCard>
      </template>
    </UDrawer>

    <UDrawer v-model:open="ui.testDrawerOpen">
      <template #content>
        <UCard class="flex h-full flex-col">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Test render</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="ui.testDrawerOpen = false" />
            </div>
          </template>
          <div class="flex-1 space-y-4 overflow-y-auto p-4">
            <div class="space-y-3">
              <UFormField v-for="field in testFields" :key="field.name" :label="field.name">
                <UInput v-model="ui.testVariables[field.name]" :placeholder="field.example || ''" class="w-full" />
              </UFormField>
            </div>
            <UButton
              label="Render"
              color="primary"
              variant="solid"
              class="w-full"
              @click="runTestRender"
            />
            <UCard>
              <template #header>
                <h4 class="font-semibold">Output</h4>
              </template>
              <div class="space-y-2">
                <UButton
                  label="Copy output"
                  icon="i-heroicons-clipboard"
                  color="neutral"
                  variant="soft"
                  @click="copy(ui.testRendered)"
                />
                <pre class="text-xs whitespace-pre-wrap">{{ ui.testRendered }}</pre>
              </div>
            </UCard>
          </div>
        </UCard>
      </template>
    </UDrawer>
  </UMain>
</template>
