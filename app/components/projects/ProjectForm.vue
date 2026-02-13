<template>
  <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit">
    <!-- ================= PROJECT INFO ================= -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="t('projects.form.labels.project_name')" name="name" required>
        <UInput v-model="state.name" class="w-full" />
      </UFormField>

      <UFormField :label="t('projects.form.labels.status')" name="status">
        <USelect
          v-model="state.status"
          :items="[
            { label: t('projects.status.draft'), value: 'draft' },
            { label: t('projects.status.active'), value: 'active' },
            { label: t('projects.status.archived'), value: 'archived' },
          ]"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="t('projects.form.labels.description')" name="description">
        <UTextarea v-model="state.description" class="w-full" />
      </UFormField>
    </div>

    <!-- ================= BUSINESS BRIEF ================= -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        :label="t('projects.form.labels.business_name')"
        name="business_brief.business_name"
        required
      >
        <UInput v-model="state.business_brief.business_name" class="w-full" />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.industry')"
        name="business_brief.industry"
        required
      >
        <USelect
          v-model="state.business_brief.industry"
          :items="industryOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.location')"
        name="business_brief.location_market"
        required
      >
        <USelect
          v-model="state.business_brief.location_market"
          :items="countryOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.main_service')"
        name="business_brief.main_service_product"
        required
      >
        <USelect
          v-model="state.business_brief.main_service_product"
          :items="computedServiceOptions"
          class="w-full"
          :disabled="!state.business_brief.industry"
          :placeholder="
            state.business_brief.industry
              ? t('projects.form.labels.select_service_placeholder')
              : t('projects.form.labels.select_industry_first')
          "
        />
      </UFormField>
    </div>

    <!-- ================= TARGET AUDIENCE ================= -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        :label="t('projects.form.labels.target_audience')"
        name="business_brief.target_audience.primary"
        required
      >
        <UInput v-model="state.business_brief.target_audience.primary" class="w-full" />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.audience_details')"
        name="business_brief.target_audience.secondary"
      >
        <UTextarea
          v-model="state.business_brief.target_audience.secondary"
          class="w-full"
          :placeholder="t('projects.form.labels.audience_notes_placeholder')"
        />
      </UFormField>
    </div>

    <!-- ================= GOALS ================= -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        :label="t('projects.form.labels.primary_goal')"
        name="business_brief.goals.primary_goal"
        required
      >
        <USelect
          v-model="state.business_brief.goals.primary_goal"
          :items="goalOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.secondary_goals')"
        name="business_brief.goals.secondary_goals"
      >
        <USelect
          v-model="state.business_brief.goals.secondary_goals"
          :items="goalOptions"
          multiple
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- ================= LANGUAGES ================= -->
    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField
        :label="t('projects.form.labels.languages_needed')"
        name="business_brief.languages.needed"
        required
      >
        <USelect
          v-model="state.business_brief.languages.needed"
          :items="languageOptions"
          multiple
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.default_language')"
        name="business_brief.languages.default_language"
        required
      >
        <USelect
          v-model="state.business_brief.languages.default_language"
          :items="languageOptions"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="t('projects.form.labels.rtl_support')"
        name="business_brief.languages.rtl_support"
      >
        <UCheckbox
          v-model="state.business_brief.languages.rtl_support"
          :label="t('projects.form.labels.enable_rtl')"
        />
      </UFormField>
    </div>

    <!-- ================= ACTIONS ================= -->
    <div class="flex justify-end gap-2 pt-4">
      <UButton
        :label="t('projects.form.actions.cancel')"
        color="neutral"
        variant="ghost"
        @click="emit('cancel')"
      />
      <UButton
        type="submit"
        :label="
          props.mode === 'create'
            ? t('projects.form.actions.create')
            : t('projects.form.actions.save')
        "
        color="primary"
      />
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import type { Project } from "~/types/projects";

const { t } = useI18n();

type IndustryValue =
  | "law_firm"
  | "dental_clinic"
  | "medical_clinic"
  | "accounting"
  | "real_estate"
  | "marketing_agency"
  | "local_services"
  | "ecommerce"
  | "other";

type BusinessBrief = {
  business_name: string;
  industry: IndustryValue | "";
  location_market: string;
  main_service_product: string;
  target_audience: {
    primary: string;
    secondary?: string;
  };
  goals: {
    primary_goal: string;
    secondary_goals: string[];
  };
  languages: {
    needed: Array<"en" | "he" | "ar">;
    default_language: "en" | "he" | "ar";
    rtl_support: boolean;
  };
};

const defaultBusinessBriefHE: BusinessBrief = {
  business_name: "",
  industry: "marketing_agency",
  location_market: "IL",
  main_service_product: "websites_landing_pages",

  target_audience: {
    primary: "בעלי עסקים קטנים ובינוניים בישראל",
    secondary: "בעלי מקצוע שרוצים יותר לידים דרך וואטסאפ וטפסים",
  },

  goals: {
    primary_goal: "lead_generation_whatsapp",
    secondary_goals: ["build_trust", "brand_awareness"],
  },

  languages: {
    needed: ["he", "ar", "en"],
    default_language: "he",
    rtl_support: true,
  },
};

const props = defineProps<{
  mode: "create" | "edit";
  modelValue: Partial<Project> & { business_brief?: Partial<BusinessBrief> };
}>();

const emit = defineEmits<{
  submit: [data: Partial<Project> & { business_brief?: BusinessBrief }];
  cancel: [];
}>();

/* ---------------- SELECT OPTIONS ---------------- */

const industryOptions = computed(() => [
  { label: t("projects.form.industry.law_firm"), value: "law_firm" },
  { label: t("projects.form.industry.dental_clinic"), value: "dental_clinic" },
  { label: t("projects.form.industry.medical_clinic"), value: "medical_clinic" },
  { label: t("projects.form.industry.accounting"), value: "accounting" },
  { label: t("projects.form.industry.real_estate"), value: "real_estate" },
  { label: t("projects.form.industry.marketing_agency"), value: "marketing_agency" },
  { label: t("projects.form.industry.local_services"), value: "local_services" },
  { label: t("projects.form.industry.ecommerce"), value: "ecommerce" },
  { label: t("projects.form.industry.other"), value: "other" },
]);

const countryOptions = computed(() => [
  { label: t("projects.form.location.IL"), value: "IL" },
  { label: t("projects.form.location.US"), value: "US" },
  { label: t("projects.form.location.GB"), value: "GB" },
  { label: t("projects.form.location.AE"), value: "AE" },
  { label: t("projects.form.location.SA"), value: "SA" },
  { label: t("projects.form.location.EG"), value: "EG" },
  { label: t("projects.form.location.JO"), value: "JO" },
  { label: t("projects.form.location.MA"), value: "MA" },
  { label: t("projects.form.location.FR"), value: "FR" },
  { label: t("projects.form.location.DE"), value: "DE" },
  { label: t("projects.form.location.CA"), value: "CA" },
]);

const goalOptions = computed(() => [
  {
    label: t("projects.form.goals.lead_generation_whatsapp"),
    value: "lead_generation_whatsapp",
  },
  {
    label: t("projects.form.goals.lead_generation_forms"),
    value: "lead_generation_forms",
  },
  { label: t("projects.form.goals.build_trust"), value: "build_trust" },
  { label: t("projects.form.goals.brand_awareness"), value: "brand_awareness" },
  { label: t("projects.form.goals.appointments"), value: "appointments" },
  { label: t("projects.form.goals.showcase_services"), value: "showcase_services" },
  { label: t("projects.form.goals.educate_market"), value: "educate_market" },
]);

const languageOptions = computed(() => [
  { label: t("projects.form.languages.en"), value: "en" },
  { label: t("projects.form.languages.he"), value: "he" },
  { label: t("projects.form.languages.ar"), value: "ar" },
]);

const serviceOptionsByIndustry = computed<
  Record<Exclude<IndustryValue, "">, Array<{ label: string; value: string }>>
>(() => ({
  law_firm: [
    {
      label: t("projects.form.services.legal_consultation"),
      value: "legal_consultation",
    },
    { label: t("projects.form.services.personal_injury"), value: "personal_injury" },
    { label: t("projects.form.services.family_law"), value: "family_law" },
    { label: t("projects.form.services.criminal_defense"), value: "criminal_defense" },
    { label: t("projects.form.services.real_estate_law"), value: "real_estate_law" },
    { label: t("projects.form.services.immigration"), value: "immigration" },
    { label: t("projects.form.services.corporate_law"), value: "corporate_law" },
  ],
  dental_clinic: [
    { label: t("projects.form.services.general_dentistry"), value: "general_dentistry" },
    { label: t("projects.form.services.dental_implants"), value: "dental_implants" },
    { label: t("projects.form.services.orthodontics"), value: "orthodontics" },
    { label: t("projects.form.services.teeth_whitening"), value: "teeth_whitening" },
    {
      label: t("projects.form.services.cosmetic_dentistry"),
      value: "cosmetic_dentistry",
    },
    { label: t("projects.form.services.emergency_dental"), value: "emergency_dental" },
  ],
  medical_clinic: [
    { label: t("projects.form.services.primary_care"), value: "primary_care" },
    { label: t("projects.form.services.dermatology"), value: "dermatology" },
    { label: t("projects.form.services.aesthetics"), value: "aesthetics" },
    { label: t("projects.form.services.physiotherapy"), value: "physiotherapy" },
    { label: t("projects.form.services.pediatrics"), value: "pediatrics" },
    { label: t("projects.form.services.gynecology"), value: "gynecology" },
  ],
  accounting: [
    { label: t("projects.form.services.bookkeeping"), value: "bookkeeping" },
    { label: t("projects.form.services.tax_filing"), value: "tax_filing" },
    { label: t("projects.form.services.payroll"), value: "payroll" },
    {
      label: t("projects.form.services.business_consulting"),
      value: "business_consulting",
    },
    { label: t("projects.form.services.vat_compliance"), value: "vat_compliance" },
  ],
  real_estate: [
    { label: t("projects.form.services.residential_sales"), value: "residential_sales" },
    {
      label: t("projects.form.services.residential_rentals"),
      value: "residential_rentals",
    },
    {
      label: t("projects.form.services.commercial_real_estate"),
      value: "commercial_real_estate",
    },
    {
      label: t("projects.form.services.property_management"),
      value: "property_management",
    },
    { label: t("projects.form.services.new_developments"), value: "new_developments" },
  ],
  marketing_agency: [
    {
      label: t("projects.form.services.websites_landing_pages"),
      value: "websites_landing_pages",
    },
    { label: t("projects.form.services.seo"), value: "seo" },
    { label: t("projects.form.services.google_ads"), value: "google_ads" },
    { label: t("projects.form.services.social_ads"), value: "social_ads" },
    { label: t("projects.form.services.branding"), value: "branding" },
    {
      label: t("projects.form.services.marketing_automation"),
      value: "marketing_automation",
    },
  ],
  local_services: [
    { label: t("projects.form.services.plumbing"), value: "plumbing" },
    { label: t("projects.form.services.electrical"), value: "electrical" },
    { label: t("projects.form.services.hvac"), value: "hvac" },
    { label: t("projects.form.services.cleaning"), value: "cleaning" },
    { label: t("projects.form.services.moving"), value: "moving" },
    { label: t("projects.form.services.renovation"), value: "renovation" },
  ],
  ecommerce: [
    { label: t("projects.form.services.online_store"), value: "online_store" },
    {
      label: t("projects.form.services.subscription_products"),
      value: "subscription_products",
    },
    { label: t("projects.form.services.dropshipping"), value: "dropshipping" },
    { label: t("projects.form.services.digital_products"), value: "digital_products" },
    { label: t("projects.form.services.brand_storefront"), value: "brand_storefront" },
  ],
  other: [
    { label: t("projects.form.services.general_services"), value: "general_services" },
    {
      label: t("projects.form.services.appointments_bookings"),
      value: "appointments_bookings",
    },
    { label: t("projects.form.services.courses_coaching"), value: "courses_coaching" },
    {
      label: t("projects.form.services.professional_profile"),
      value: "professional_profile",
    },
  ],
}));

/* ---------------- SCHEMA (updated with base project fields) ---------------- */

const schema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),

  business_brief: z.object({
    business_name: z.string().min(2, "Business name is required"),
    industry: z.enum([
      "law_firm",
      "dental_clinic",
      "medical_clinic",
      "accounting",
      "real_estate",
      "marketing_agency",
      "local_services",
      "ecommerce",
      "other",
    ]),
    location_market: z.string().min(2, "Country is required"),
    main_service_product: z.string().min(1, "Main service/product is required"),
    target_audience: z.object({
      primary: z.string().min(2, "Primary audience is required"),
      secondary: z.string().optional(),
    }),
    goals: z.object({
      primary_goal: z.string().min(1, "Primary goal is required"),
      secondary_goals: z.array(z.string()).default([]),
    }),
    languages: z.object({
      needed: z.array(z.enum(["en", "he", "ar"])).min(1, "Pick at least one language"),
      default_language: z.enum(["en", "he", "ar"]),
      rtl_support: z.boolean().default(true),
    }),
  }),
});

type Schema = z.output<typeof schema>;

/* ---------------- STATE (updated with base project fields) ---------------- */

const state = reactive<Schema>({
  name: props.modelValue.name || "Focus AI",
  description: (props.modelValue.description as any) ?? null,
  status: (props.modelValue.status as any) || "draft",

  business_brief: {
    business_name: props.modelValue.business_brief?.business_name || "Focus AI",
    industry: (props.modelValue.business_brief?.industry as any) || "marketing_agency",
    location_market: props.modelValue.business_brief?.location_market || "IL",
    main_service_product:
      props.modelValue.business_brief?.main_service_product || "websites_landing_pages",
    target_audience: {
      primary:
        props.modelValue.business_brief?.target_audience?.primary ||
        "בעלי עסקים קטנים ובינוניים בישראל",
      secondary:
        props.modelValue.business_brief?.target_audience?.secondary ||
        "בעלי מקצוע שרוצים יותר לידים דרך וואטסאפ וטפסים",
    },
    goals: {
      primary_goal:
        props.modelValue.business_brief?.goals?.primary_goal ||
        "lead_generation_whatsapp",
      secondary_goals: props.modelValue.business_brief?.goals?.secondary_goals || [
        "build_trust",
        "brand_awareness",
      ],
    },
    languages: {
      needed: (props.modelValue.business_brief?.languages?.needed as any) || [
        "he",
        "ar",
        "en",
      ],
      default_language:
        (props.modelValue.business_brief?.languages?.default_language as any) || "he",
      rtl_support: props.modelValue.business_brief?.languages?.rtl_support ?? true,
    },
  },
});

/* ---------------- COMPUTEDS ---------------- */

const computedServiceOptions = computed(() => {
  const ind = state.business_brief.industry as Exclude<IndustryValue, "">;
  return ind ? serviceOptionsByIndustry.value[ind] || [] : [];
});

/* ---------------- WATCHERS ---------------- */

watch(
  () => state.business_brief.industry,
  () => {
    const opts = computedServiceOptions.value;
    const ok = opts.some((o) => o.value === state.business_brief.main_service_product);
    if (!ok) state.business_brief.main_service_product = "";
  }
);

function onSubmit(event: FormSubmitEvent<Schema>) {
  emit("submit", event.data);
}
</script>
