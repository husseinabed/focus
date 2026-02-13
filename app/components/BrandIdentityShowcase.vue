<!-- ~/components/BrandIdentityShowcase.vue -->
<template>
  <div
    class="min-h-screen"
    :style="{
      background: brand.color_system.neutral.background,
      color: brand.color_system.neutral.text_primary,
      fontFamily: fontStack,
    }"
    dir="rtl"
  >
    <!-- Top bar -->
    <header
      class="sticky top-0 z-10 border-b backdrop-blur"
      :style="{
        borderColor: brand.color_system.neutral.border,
        background: withAlpha(brand.color_system.neutral.surface, 0.85),
      }"
    >
      <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="grid place-items-center font-semibold"
            :style="{
              width: '38px',
              height: '38px',
              borderRadius: pxR('md'),
              background: brand.color_system.primary.base,
              color: brand.color_system.primary.contrast_text,
              boxShadow: brand.shadow.sm,
            }"
          >
            FA
          </div>
          <div class="leading-tight">
            <div class="font-semibold">Focus AI</div>
            <div
              class="text-sm"
              :style="{ color: brand.color_system.neutral.text_secondary }"
            >
              Brand Identity · Visual Showcase
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-2 text-sm font-semibold"
            :style="btnStyle('ghost')"
            @click="setLang('en')"
          >
            EN
          </button>
          <button
            class="px-3 py-2 text-sm font-semibold"
            :style="btnStyle('ghost')"
            @click="setLang('he')"
          >
            HE
          </button>
          <button
            class="px-3 py-2 text-sm font-semibold"
            :style="btnStyle('ghost')"
            @click="setLang('ar')"
          >
            AR
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <!-- Hero -->
      <section class="border overflow-hidden" :style="cardStyle()">
        <div class="p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center">
          <div class="space-y-3">
            <div
              class="inline-flex items-center gap-2 border px-3 py-1 text-sm font-medium"
              :style="pillStyle(brand.color_system.primary.base)"
            >
              <span
                class="inline-block"
                :style="{
                  width: '10px',
                  height: '10px',
                  borderRadius: '999px',
                  background: brand.color_system.accent.base,
                }"
              />
              {{ t.kicker }}
            </div>

            <h1 class="font-bold tracking-tight" :style="headingStyle('h1')">
              {{ t.title }}
            </h1>

            <p :style="bodyStyle()">
              {{ t.subtitle }}
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <!-- Accent CTA (rule: lead-gen CTA uses Accent) -->
              <button class="px-4 py-3 font-semibold" :style="btnStyle('accent')">
                {{ t.ctaAccent }}
              </button>
              <button class="px-4 py-3 font-semibold" :style="btnStyle('primary')">
                {{ t.ctaPrimary }}
              </button>
              <button class="px-4 py-3 font-semibold" :style="btnStyle('outline')">
                {{ t.ctaOutline }}
              </button>
            </div>

            <div
              class="pt-3 text-sm"
              :style="{ color: brand.color_system.neutral.text_secondary }"
            >
              {{ t.note }}
            </div>
          </div>

          <div class="grid gap-3">
            <div class="grid grid-cols-2 gap-3">
              <div :style="miniCardStyle('primary')">
                <div class="text-sm font-semibold">{{ t.primary }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ brand.color_system.primary.base }}
                </div>
              </div>
              <div :style="miniCardStyle('accent')">
                <div class="text-sm font-semibold">{{ t.accent }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ brand.color_system.accent.base }}
                </div>
              </div>
              <div :style="miniCardStyle('secondary')">
                <div class="text-sm font-semibold">{{ t.secondary }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ brand.color_system.secondary.base }}
                </div>
              </div>
              <div :style="miniCardStyle('surface')">
                <div class="text-sm font-semibold">{{ t.neutral }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ brand.color_system.neutral.surface }}
                </div>
              </div>
            </div>

            <div class="border p-4" :style="cardStyle('sm')">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="font-semibold">{{ t.identitySummaryTitle }}</div>
                  <div
                    class="text-sm"
                    :style="{ color: brand.color_system.neutral.text_secondary }"
                  >
                    {{ t.identitySummary }}
                  </div>
                </div>
                <div
                  class="hidden md:block text-right text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  <div>
                    {{ t.radius }}: {{ pxR("lg") }} / {{ pxR("md") }} / {{ pxR("sm") }}
                  </div>
                  <div>{{ t.shadow }}: sm / md / lg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography + Controls -->
      <section class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 border" :style="cardStyle()">
          <div class="p-6 space-y-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="font-bold" :style="headingStyle('h2')">{{ t.typeTitle }}</h2>
                <p
                  class="text-sm"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ t.typeDesc }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ t.weight }}
                </span>
                <select
                  class="px-3 py-2 text-sm border bg-white"
                  :style="inputStyle()"
                  v-model="weightKey"
                >
                  <option value="regular">regular</option>
                  <option value="medium">medium</option>
                  <option value="semibold">semibold</option>
                  <option value="bold">bold</option>
                </select>
              </div>
            </div>

            <div class="space-y-3">
              <div class="font-bold" :style="previewStyle('h1')">{{ t.sampleH1 }}</div>
              <div class="font-semibold" :style="previewStyle('h2')">
                {{ t.sampleH2 }}
              </div>
              <div class="font-semibold" :style="previewStyle('h3')">
                {{ t.sampleH3 }}
              </div>
              <p :style="previewStyle('body')">{{ t.sampleBody }}</p>
              <p :style="previewStyle('small')">{{ t.sampleSmall }}</p>
            </div>

            <div
              class="pt-2 border-t"
              :style="{ borderColor: brand.color_system.neutral.border }"
            >
              <div class="grid sm:grid-cols-2 gap-3">
                <div class="text-sm">
                  <div class="font-semibold">{{ t.lineHeights }}</div>
                  <div :style="{ color: brand.color_system.neutral.text_secondary }">
                    body: {{ brand.typography.line_height.body }} · headings:
                    {{ brand.typography.line_height.headings }}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="font-semibold">{{ t.fonts }}</div>
                  <div :style="{ color: brand.color_system.neutral.text_secondary }">
                    {{ brand.typography.font_families.latin }} /
                    {{ brand.typography.font_families.hebrew }} /
                    {{ brand.typography.font_families.arabic }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border" :style="cardStyle()">
          <div class="p-6 space-y-4">
            <h3 class="font-bold" :style="headingStyle('h3')">{{ t.tokensTitle }}</h3>

            <div class="space-y-3">
              <div class="text-sm font-semibold">{{ t.spacing }}</div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(v, k) in brand.spacing"
                  :key="k"
                  class="border p-3"
                  :style="{
                    borderColor: brand.color_system.neutral.border,
                    borderRadius: pxR('md'),
                    background: brand.color_system.neutral.surface,
                  }"
                >
                  <div class="text-xs font-semibold">{{ k }}</div>
                  <div
                    class="text-xs"
                    :style="{ color: brand.color_system.neutral.text_secondary }"
                  >
                    {{ rem(v) }}
                  </div>
                  <div
                    class="mt-2 w-full"
                    :style="{
                      height: '8px',
                      borderRadius: '999px',
                      background: withAlpha(brand.color_system.primary.base, 0.15),
                    }"
                  >
                    <div
                      :style="{
                        width: `${Math.min(100, v * 40)}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: brand.color_system.primary.base,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm font-semibold">{{ t.radius }}</div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="k in ['lg', 'md', 'sm']"
                  :key="k"
                  class="border p-3"
                  :style="{
                    borderColor: brand.color_system.neutral.border,
                    borderRadius: pxR(k as any),
                    background: brand.color_system.neutral.surface,
                  }"
                >
                  <div class="text-xs font-semibold">{{ k }}</div>
                  <div
                    class="text-xs"
                    :style="{ color: brand.color_system.neutral.text_secondary }"
                  >
                    {{ pxR(k as any) }}
                  </div>
                  <div
                    class="mt-2 h-8 border"
                    :style="{
                      borderColor: withAlpha(brand.color_system.neutral.border, 0.8),
                      borderRadius: pxR(k as any),
                      background: withAlpha(brand.color_system.secondary.base, 0.06),
                    }"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="text-sm font-semibold">{{ t.shadow }}</div>
              <div class="grid gap-2">
                <div
                  v-for="k in ['sm', 'md', 'lg']"
                  :key="k"
                  class="border p-3"
                  :style="{
                    borderColor: brand.color_system.neutral.border,
                    borderRadius: pxR('md'),
                    background: brand.color_system.neutral.surface,
                    boxShadow: brand.shadow[k as any],
                  }"
                >
                  <div class="text-xs font-semibold">{{ k }}</div>
                  <div
                    class="text-xs"
                    :style="{ color: brand.color_system.neutral.text_secondary }"
                  >
                    {{ brand.shadow[k as any] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- UI Components -->
      <section class="border" :style="cardStyle()">
        <div class="p-6 space-y-6">
          <div>
            <h2 class="font-bold" :style="headingStyle('h2')">{{ t.uiTitle }}</h2>
            <p
              class="text-sm"
              :style="{ color: brand.color_system.neutral.text_secondary }"
            >
              {{ t.uiDesc }}
            </p>
          </div>

          <div class="grid lg:grid-cols-3 gap-4">
            <!-- Card -->
            <div class="border p-5 space-y-3" :style="cardStyle()">
              <div class="flex items-center justify-between">
                <div class="font-semibold">{{ t.cardTitle }}</div>
                <span
                  class="text-xs border px-2 py-1"
                  :style="pillStyle(brand.color_system.secondary.base)"
                >
                  {{ t.badge }}
                </span>
              </div>
              <p
                class="text-sm"
                :style="{ color: brand.color_system.neutral.text_secondary }"
              >
                {{ t.cardBody }}
              </p>
              <div class="flex gap-2 pt-1">
                <button
                  class="px-3 py-2 text-sm font-semibold"
                  :style="btnStyle('accent')"
                >
                  {{ t.ctaAccent }}
                </button>
                <button
                  class="px-3 py-2 text-sm font-semibold"
                  :style="btnStyle('outline')"
                >
                  {{ t.learnMore }}
                </button>
              </div>
            </div>

            <!-- Form -->
            <div class="border p-5 space-y-3" :style="cardStyle()">
              <div class="font-semibold">{{ t.formTitle }}</div>
              <label
                class="text-xs"
                :style="{ color: brand.color_system.neutral.text_secondary }"
                >{{ t.fieldLabel }}</label
              >
              <input
                class="w-full px-3 py-2 border bg-white"
                :style="inputStyle()"
                :placeholder="t.placeholder"
              />
              <div class="flex items-center justify-between text-xs">
                <span :style="{ color: brand.color_system.neutral.text_secondary }">{{
                  t.helper
                }}</span>
                <span
                  class="font-semibold"
                  :style="{ color: brand.color_system.status.error }"
                  >{{ t.required }}</span
                >
              </div>
              <button class="w-full px-4 py-3 font-semibold" :style="btnStyle('primary')">
                {{ t.submit }}
              </button>
            </div>

            <!-- Status -->
            <div class="border p-5 space-y-3" :style="cardStyle()">
              <div class="font-semibold">{{ t.statusTitle }}</div>

              <div class="border p-3 text-sm" :style="statusStyle('success')">
                <div class="font-semibold">{{ t.successTitle }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ t.successBody }}
                </div>
              </div>

              <div class="border p-3 text-sm" :style="statusStyle('warning')">
                <div class="font-semibold">{{ t.warningTitle }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ t.warningBody }}
                </div>
              </div>

              <div class="border p-3 text-sm" :style="statusStyle('error')">
                <div class="font-semibold">{{ t.errorTitle }}</div>
                <div
                  class="text-xs"
                  :style="{ color: brand.color_system.neutral.text_secondary }"
                >
                  {{ t.errorBody }}
                </div>
              </div>
            </div>
          </div>

          <!-- Usage rules -->
          <div
            class="border-t pt-6"
            :style="{ borderColor: brand.color_system.neutral.border }"
          >
            <h3 class="font-bold" :style="headingStyle('h3')">{{ t.rulesTitle }}</h3>
            <div class="mt-4 grid md:grid-cols-2 gap-4">
              <div
                v-for="(r, i) in brand.usage_rules"
                :key="i"
                class="border p-4"
                :style="cardStyle('sm')"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="grid place-items-center font-bold text-sm"
                    :style="{
                      width: '34px',
                      height: '34px',
                      borderRadius: pxR('md'),
                      background: withAlpha(brand.color_system.primary.base, 0.12),
                      color: brand.color_system.primary.base,
                    }"
                  >
                    {{ i + 1 }}
                  </div>
                  <div class="space-y-1">
                    <div class="font-semibold">{{ r.rule }}</div>
                    <div
                      class="text-sm"
                      :style="{ color: brand.color_system.neutral.text_secondary }"
                    >
                      {{ r.rationale }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        class="py-10 text-center text-sm"
        :style="{ color: brand.color_system.neutral.text_secondary }"
      >
        {{ t.footer }}
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
type Brand = typeof brandDefault;

const props = defineProps<{
  brand: Brand;
}>();

/* -------------------------------------------------------------------------- */
/* Brand defaults (only used if parent doesn’t pass prop)                      */
/* -------------------------------------------------------------------------- */
const brandDefault = {
  radius: { lg: 0.75, md: 0.5, sm: 0.25 },
  shadow: {
    lg: "0px 10px 15px rgba(0, 0, 0, 0.15)",
    md: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    sm: "0px 1px 3px rgba(0, 0, 0, 0.08)",
  },
  spacing: { lg: 1.5, md: 1, sm: 0.5, xl: 2, xs: 0.25 },
  typography: {
    scale: { h1: "3rem", h2: "2.25rem", h3: "1.5rem", body: "1rem", small: "0.875rem" },
    weights: { bold: 700, medium: 500, regular: 400, semibold: 600 },
    line_height: { body: 1.6, headings: 1.2 },
    font_families: {
      latin: "Noto Sans",
      arabic: "Noto Sans Arabic",
      hebrew: "Noto Sans Hebrew",
      fallback: "sans-serif",
    },
  },
  usage_rules: [],
  color_system: {
    accent: { base: "#28A745", usage: [], contrast_text: "#FFFFFF" },
    status: { error: "#DC3545", success: "#28A745", warning: "#FFC107" },
    neutral: {
      border: "#E2E8F0",
      surface: "#FFFFFF",
      background: "#F8FAFC",
      text_primary: "#1A202C",
      text_secondary: "#4A5568",
    },
    primary: { base: "#0056B3", usage: [], contrast_text: "#FFFFFF" },
    secondary: { base: "#4A5568", usage: [], contrast_text: "#FFFFFF" },
  },
  schema_version: "1.0.0",
  identity_summary: "",
  localization_notes: { ar: [], en: [], he: [] },
};

const brand = computed(() => props.brand ?? (brandDefault as any));

/* -------------------------------------------------------------------------- */
/* Language toggle                                                            */
/* -------------------------------------------------------------------------- */
type Lang = "en" | "he" | "ar";
const lang = ref<Lang>("he");
const weightKey = ref<keyof Brand["typography"]["weights"]>("semibold");

const copy = {
  en: {
    kicker: "Trust-first · WhatsApp-first",
    title: "A clean, confident identity for local growth.",
    subtitle:
      "Professional blue + WhatsApp green, clear typography, and generous spacing — built for multilingual EN/HE/AR and RTL-friendly layouts.",
    ctaAccent: "Get a Free Consultation",
    ctaPrimary: "See Example Website",
    ctaOutline: "Talk on WhatsApp",
    note: "Rule: Lead-gen CTAs use Accent color for maximum visibility.",
    primary: "Primary",
    accent: "Accent",
    secondary: "Secondary",
    neutral: "Neutral Surface",
    identitySummaryTitle: "Identity summary",
    identitySummary: computed(
      () =>
        brand.value.identity_summary ||
        "Professional · trustworthy · modern · accessible."
    ),
    radius: "Radius",
    shadow: "Shadow",
    typeTitle: "Typography",
    typeDesc:
      "Type scale, weights, and line-heights for consistent readability across languages.",
    weight: "Weight",
    sampleH1: "Build trust in seconds.",
    sampleH2: "Clear hierarchy, clean spacing.",
    sampleH3: "Designed for mobile-first browsing.",
    sampleBody:
      "Focus AI helps Israeli SMBs launch multilingual websites that convert interest into direct WhatsApp leads — with modern design and accessibility-first structure.",
    sampleSmall:
      "Small text stays readable using neutral text colors and proper contrast.",
    lineHeights: "Line-heights",
    fonts: "Font families",
    tokensTitle: "Tokens",
    spacing: "Spacing",
    uiTitle: "UI Examples",
    uiDesc:
      "Cards, forms, statuses — using neutral surfaces, subtle borders, and purposeful shadows.",
    cardTitle: "Lead Capture Card",
    badge: "NEW",
    cardBody:
      "Use accent for primary conversion actions, and keep surfaces clean and readable.",
    learnMore: "Learn more",
    formTitle: "Contact Form",
    fieldLabel: "Business name",
    placeholder: "e.g., Al Noor Dental Clinic",
    helper: "We’ll reply on WhatsApp.",
    required: "Required",
    submit: "Send",
    statusTitle: "Status patterns",
    successTitle: "Success",
    successBody: "Confirmation and positive feedback.",
    warningTitle: "Warning",
    warningBody: "Something needs attention.",
    errorTitle: "Error",
    errorBody: "Fix an input issue and try again.",
    rulesTitle: "Usage rules",
    footer: "Focus AI · Brand showcase component",
  },
  he: {
    kicker: "אמינות קודם · וואטסאפ קודם",
    title: "זהות נקייה ובטוחה לצמיחה מקומית.",
    subtitle:
      "כחול מקצועי + ירוק וואטסאפ, טיפוגרפיה ברורה וריווח נדיב — מותאם ל־EN/HE/AR עם תמיכה מלאה ב־RTL.",
    ctaAccent: "ייעוץ חינם",
    ctaPrimary: "לראות אתר לדוגמה",
    ctaOutline: "לדבר בוואטסאפ",
    note: "כלל: כפתורי המרה (לידים) חייבים להשתמש בצבע Accent.",
    primary: "Primary",
    accent: "Accent",
    secondary: "Secondary",
    neutral: "Neutral Surface",
    identitySummaryTitle: "סיכום זהות",
    identitySummary: computed(
      () => brand.value.identity_summary || "מקצועי · אמין · מודרני · נגיש."
    ),
    radius: "רדיוס",
    shadow: "צל",
    typeTitle: "טיפוגרפיה",
    typeDesc: "סקייל, משקלים ו־line-height לקריאות עקבית בכל השפות.",
    weight: "משקל",
    sampleH1: "בונים אמון בשניות.",
    sampleH2: "היררכיה ברורה, ריווח נקי.",
    sampleH3: "נבנה למובייל קודם.",
    sampleBody:
      "Focus AI עוזרת לעסקים בישראל להשיק אתרים רב־לשוניים שממירים עניין ללידים בוואטסאפ — עם עיצוב מודרני ומבנה נגיש.",
    sampleSmall: "טקסט קטן נשאר קריא בעזרת צבעי ניוטרל וקונטרסט נכון.",
    lineHeights: "Line-heights",
    fonts: "משפחות פונטים",
    tokensTitle: "טוקנים",
    spacing: "ריווח",
    uiTitle: "דוגמאות UI",
    uiDesc: "כרטיסים, טפסים, סטטוסים — משטחים נקיים, גבולות עדינים וצללים שימושיים.",
    cardTitle: "כרטיס ללידים",
    badge: "חדש",
    cardBody: "השתמשו ב־Accent לפעולות המרה, ושמרו על משטחים נקיים וקריאים.",
    learnMore: "לפרטים",
    formTitle: "טופס יצירת קשר",
    fieldLabel: "שם העסק",
    placeholder: "לדוגמה: מרפאת שיניים אל-נור",
    helper: "נחזור אליך בוואטסאפ.",
    required: "חובה",
    submit: "שליחה",
    statusTitle: "דפוסי סטטוס",
    successTitle: "הצלחה",
    successBody: "אישור ופידבק חיובי.",
    warningTitle: "אזהרה",
    warningBody: "נדרש טיפול/תשומת לב.",
    errorTitle: "שגיאה",
    errorBody: "תקנו שדה ונסו שוב.",
    rulesTitle: "כללי שימוש",
    footer: "Focus AI · קומפוננטת Showcase",
  },
  ar: {
    kicker: "الثقة أولاً · واتساب أولاً",
    title: "هوية نظيفة وواثقة للنمو المحلي.",
    subtitle:
      "أزرق احترافي + أخضر واتساب، خطوط واضحة ومساحات مريحة — داعمة لـ EN/HE/AR مع RTL بشكل طبيعي.",
    ctaAccent: "استشارة مجانية",
    ctaPrimary: "عرض مثال موقع",
    ctaOutline: "تواصل واتساب",
    note: "قاعدة: أزرار توليد العملاء يجب أن تستخدم لون Accent.",
    primary: "Primary",
    accent: "Accent",
    secondary: "Secondary",
    neutral: "Neutral Surface",
    identitySummaryTitle: "ملخص الهوية",
    identitySummary: computed(
      () => brand.value.identity_summary || "احترافي · موثوق · عصري · سهل القراءة."
    ),
    radius: "الحواف",
    shadow: "الظل",
    typeTitle: "الطباعة",
    typeDesc: "مقاسات الخط والأوزان و line-height لقراءة مريحة في كل اللغات.",
    weight: "الوزن",
    sampleH1: "نبني الثقة خلال ثوانٍ.",
    sampleH2: "تسلسل بصري واضح ومساحات نظيفة.",
    sampleH3: "مصمم للموبايل أولاً.",
    sampleBody:
      "Focus AI تساعد الشركات الصغيرة في إسرائيل على إطلاق مواقع متعددة اللغات تحوّل الاهتمام إلى رسائل واتساب مباشرة — بتصميم عصري وبنية تراعي سهولة الوصول.",
    sampleSmall: "النص الصغير يبقى واضحاً باستخدام ألوان محايدة وتباين مناسب.",
    lineHeights: "Line-heights",
    fonts: "عائلات الخط",
    tokensTitle: "Tokens",
    spacing: "المسافات",
    uiTitle: "أمثلة واجهة",
    uiDesc: "بطاقات، نماذج، حالات — أسطح محايدة وحدود خفيفة وظلال وظيفية.",
    cardTitle: "بطاقة جمع العملاء",
    badge: "جديد",
    cardBody: "استخدم Accent لأزرار التحويل، وابقِ المحتوى واضحاً وسهل القراءة.",
    learnMore: "المزيد",
    formTitle: "نموذج تواصل",
    fieldLabel: "اسم النشاط",
    placeholder: "مثال: عيادة النور للأسنان",
    helper: "سنرد عبر واتساب.",
    required: "مطلوب",
    submit: "إرسال",
    statusTitle: "أنماط الحالة",
    successTitle: "نجاح",
    successBody: "تأكيد ورسالة إيجابية.",
    warningTitle: "تحذير",
    warningBody: "هناك شيء يحتاج انتباه.",
    errorTitle: "خطأ",
    errorBody: "صحح الحقل وحاول مرة أخرى.",
    rulesTitle: "قواعد الاستخدام",
    footer: "Focus AI · مكوّن العرض البصري",
  },
} as const;

const t = computed(() => copy[lang.value]);

const fontStack = computed(() => {
  const f = brand.value.typography.font_families;
  // Use language-specific font first, then fallbacks
  if (lang.value === "ar") return `${f.arabic}, ${f.latin}, ${f.fallback}`;
  if (lang.value === "he") return `${f.hebrew}, ${f.latin}, ${f.fallback}`;
  return `${f.latin}, ${f.fallback}`;
});

function setLang(next: Lang) {
  lang.value = next;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const pxR = (k: "lg" | "md" | "sm") => `${brand.value.radius[k] * 16}px`;
const rem = (n: number) => `${n}rem`;

function withAlpha(hex: string, alpha: number) {
  // hex #RRGGBB -> rgba(r,g,b,a)
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cardStyle(size: "sm" | "md" = "md") {
  return {
    borderColor: brand.value.color_system.neutral.border,
    borderRadius: pxR("lg"),
    background: brand.value.color_system.neutral.surface,
    boxShadow: size === "sm" ? brand.value.shadow.sm : brand.value.shadow.md,
  } as const;
}

function pillStyle(base: string) {
  return {
    borderColor: withAlpha(base, 0.25),
    borderRadius: "999px",
    background: withAlpha(base, 0.08),
    color: base,
  } as const;
}

function headingStyle(k: "h1" | "h2" | "h3") {
  return {
    fontSize: brand.value.typography.scale[k],
    lineHeight: brand.value.typography.line_height.headings,
  } as const;
}

function bodyStyle() {
  return {
    fontSize: brand.value.typography.scale.body,
    lineHeight: brand.value.typography.line_height.body,
    color: brand.value.color_system.neutral.text_secondary,
  } as const;
}

function previewStyle(k: "h1" | "h2" | "h3" | "body" | "small") {
  const isHeading = k === "h1" || k === "h2" || k === "h3";
  return {
    fontSize: brand.value.typography.scale[k],
    lineHeight: isHeading
      ? brand.value.typography.line_height.headings
      : brand.value.typography.line_height.body,
    fontWeight: brand.value.typography.weights[weightKey.value],
    color: isHeading
      ? brand.value.color_system.neutral.text_primary
      : brand.value.color_system.neutral.text_secondary,
  } as const;
}

function inputStyle() {
  return {
    borderColor: brand.value.color_system.neutral.border,
    borderRadius: pxR("md"),
    boxShadow: brand.value.shadow.sm,
    outline: "none",
  } as const;
}

function btnStyle(kind: "accent" | "primary" | "outline" | "ghost") {
  const r = pxR("md");
  const base = {
    borderRadius: r,
    boxShadow: brand.value.shadow.sm,
    transition: "transform 120ms ease, opacity 120ms ease",
  } as const;

  if (kind === "accent") {
    return {
      ...base,
      background: brand.value.color_system.accent.base,
      color: brand.value.color_system.accent.contrast_text,
      border: `1px solid ${withAlpha(brand.value.color_system.accent.base, 0.35)}`,
    } as const;
  }
  if (kind === "primary") {
    return {
      ...base,
      background: brand.value.color_system.primary.base,
      color: brand.value.color_system.primary.contrast_text,
      border: `1px solid ${withAlpha(brand.value.color_system.primary.base, 0.35)}`,
    } as const;
  }
  if (kind === "outline") {
    return {
      ...base,
      background: brand.value.color_system.neutral.surface,
      color: brand.value.color_system.neutral.text_primary,
      border: `1px solid ${brand.value.color_system.neutral.border}`,
    } as const;
  }
  return {
    ...base,
    background: "transparent",
    color: brand.value.color_system.neutral.text_primary,
    border: `1px solid ${withAlpha(brand.value.color_system.neutral.border, 0.9)}`,
    boxShadow: "none",
  } as const;
}

function miniCardStyle(kind: "primary" | "accent" | "secondary" | "surface") {
  const colors = brand.value.color_system;
  const map = {
    primary: colors.primary.base,
    accent: colors.accent.base,
    secondary: colors.secondary.base,
    surface: colors.neutral.surface,
  } as const;

  const bg = kind === "surface" ? colors.neutral.surface : withAlpha(map[kind], 0.08);

  return {
    border: `1px solid ${colors.neutral.border}`,
    borderRadius: pxR("lg"),
    background: bg,
    padding: "14px",
  } as const;
}

function statusStyle(k: "success" | "warning" | "error") {
  const c = brand.value.color_system.status[k];
  return {
    borderColor: withAlpha(c, 0.35),
    borderRadius: pxR("lg"),
    background: withAlpha(c, 0.08),
  } as const;
}
</script>
