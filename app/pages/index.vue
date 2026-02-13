<!-- app/pages/index.vue -->
<script setup lang="ts">
import { z } from "zod";

definePageMeta({ layout: "default" });

const { t } = useI18n();

type Lang = "he" | "ar" | "en";
type Industry =
  | "dental_clinic"
  | "law_firm"
  | "medical_clinic"
  | "accounting"
  | "real_estate"
  | "marketing_agency"
  | "local_services"
  | "ecommerce"
  | "other";

type ChatRole = "assistant" | "user";
type ChatMsg = { id: string; role: ChatRole; content: string; ts: number };

type CardKind = "industry" | "languages" | "goals";
type ChatCard = {
  id: string;
  kind: CardKind;
  title: string;
  subtitle?: string;
};

type AssistantItem = ChatMsg & {
  cards?: ChatCard[];
};

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

const schema = z.object({
  name: z.string().min(1, t("onboarding.validation.name_required")),
  description: z.string().min(10, t("onboarding.validation.desc_length")),
  industry: z.custom<Industry>().optional(),
  location_market: z.string().optional(),
  languages_needed: z
    .array(z.custom<Lang>())
    .min(1, t("onboarding.validation.lang_required")),
  default_language: z.custom<Lang>(),
  goals_primary: z.string().min(1, t("onboarding.validation.goal_required")),
  goals_secondary: z.array(z.string()).optional(),
});

const industries = computed<Array<{ label: string; value: Industry }>>(() => [
  { label: t("projects.form.industry.dental_clinic"), value: "dental_clinic" },
  { label: t("projects.form.industry.law_firm"), value: "law_firm" },
  { label: t("projects.form.industry.medical_clinic"), value: "medical_clinic" },
  { label: t("projects.form.industry.accounting"), value: "accounting" },
  { label: t("projects.form.industry.real_estate"), value: "real_estate" },
  { label: t("projects.form.industry.marketing_agency"), value: "marketing_agency" },
  { label: t("projects.form.industry.local_services"), value: "local_services" },
  { label: t("projects.form.industry.ecommerce"), value: "ecommerce" },
  { label: t("projects.form.industry.other"), value: "other" },
]);

const goalsPrimaryPresets = computed(() => [
  t("projects.form.goals.lead_generation_whatsapp"),
  t("projects.form.goals.appointments"),
  t("projects.form.goals.build_trust"),
  t("projects.form.goals.showcase_services"),
  t("projects.form.goals.brand_awareness"),
]);

const goalsSecondaryPresets = computed(() => [
  t("projects.form.goals.seo_visibility"),
  t("projects.form.goals.reviews"),
  t("projects.form.goals.multilingual"),
  t("projects.form.goals.faster_response"),
  t("projects.form.goals.reduce_noshows"),
]);

const state = reactive({
  name: "",
  description: "",
  industry: "dental_clinic" as Industry,
  location_market: "",
  languages_needed: ["he"] as Lang[],
  default_language: "he" as Lang,
  goals_primary: "",
  goals_secondary: [] as string[],
});

const ui = reactive({
  step: 0 as 0 | 1 | 2,
  optionStep: 0 as 0 | 1 | 2, // 0=industry, 1=languages, 2=goals
  input: "",
  isGenerating: false,
  isWriting: false,
  error: "" as string,
});

const items = ref<AssistantItem[]>([
  {
    id: uid(),
    role: "assistant",
    content: t("onboarding.chat.initial_message"),
    ts: Date.now(),
  },
]);

function push(role: ChatRole, content: string) {
  items.value.push({ id: uid(), role, content, ts: Date.now() });
}

async function pushAssistantDelayed(content: string) {
  ui.isWriting = true;
  await new Promise((resolve) => setTimeout(resolve, 600));
  ui.isWriting = false;
  push("assistant", content);
}

function pushAssistantWithCards(content: string, cards: ChatCard[]) {
  items.value.push({
    id: uid(),
    role: "assistant",
    content,
    ts: Date.now(),
    cards,
  });
}

async function pushAssistantWithCardsDelayed(content: string, cards: ChatCard[]) {
  ui.isWriting = true;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  ui.isWriting = false;
  pushAssistantWithCards(content, cards);
}

// ---------- One-card-at-a-time options flow ----------
function pushOptionCard(kind: CardKind) {
  if (kind === "industry") {
    pushAssistantWithCardsDelayed(t("onboarding.chat.options_message"), [
      {
        id: uid(),
        kind: "industry",
        title: t("onboarding.card.industry"),
        subtitle: t("onboarding.card.industry_subtitle"),
      },
    ]);
    return;
  }

  if (kind === "languages") {
    pushAssistantWithCardsDelayed(t("onboarding.chat.options_message"), [
      {
        id: uid(),
        kind: "languages",
        title: t("onboarding.card.languages"),
        subtitle: t("onboarding.card.languages_subtitle"),
      },
    ]);
    return;
  }

  pushAssistantWithCardsDelayed(t("onboarding.chat.options_message"), [
    {
      id: uid(),
      kind: "goals",
      title: t("onboarding.card.goals"),
      subtitle: t("onboarding.card.goals_subtitle"),
    },
  ]);
}

function startOptions() {
  ui.step = 2;
  ui.optionStep = 0;
  pushOptionCard("industry");
}

function advanceOptionCard() {
  // optional: basic “must pick” checks before advancing
  if (ui.optionStep === 0) {
    if (!state.industry) {
      push("assistant", t("onboarding.validation.incomplete"));
      return;
    }
    ui.optionStep = 1;
    pushAssistantDelayed(t("onboarding.chat.saved_message")).then(() => {
      pushOptionCard("languages");
    });
    return;
  }

  if (ui.optionStep === 1) {
    if (!state.languages_needed?.length) {
      push("assistant", t("onboarding.validation.lang_required"));
      return;
    }
    ui.optionStep = 2;
    pushAssistantDelayed(t("onboarding.chat.saved_message")).then(() => {
      pushOptionCard("goals");
    });
    return;
  }

  // goals card done
  if (!state.goals_primary || !state.goals_primary.trim()) {
    push("assistant", t("onboarding.validation.goal_required"));
    return;
  }

  pushAssistantDelayed(t("onboarding.chat.saved_message")).then(async () => {
    // ✅ add this translation key
    // onboarding.chat.ready_to_generate_message: "All set ✅ Click Generate when ready."
    // pushAssistantDelayed(t("onboarding.chat.ready_to_generate_message"));
    await onGenerate();
  });
}
// ----------------------------------------------------

function nextQuestion() {
  if (ui.step === 0) {
    ui.step = 1;
    pushAssistantDelayed(t("onboarding.chat.describe_message"));
    return;
  }

  if (ui.step === 1) {
    startOptions();
    return;
  }
}

function applyUserText(text: string) {
  const msg = text.trim();
  if (!msg) return;
  push("user", msg);

  if (ui.step === 0) {
    state.name = msg;
    nextQuestion();
    return;
  }

  if (ui.step === 1) {
    state.description = msg;
    nextQuestion();
    return;
  }

  // step 2: extra notes
  state.description = `${state.description}\n\nExtra notes: ${msg}`.trim();
  pushAssistantDelayed(t("onboarding.chat.added_message"));
}

function send() {
  ui.error = "";
  try {
    applyUserText(ui.input);
    ui.input = "";
  } catch (e: any) {
    ui.error = e?.message || t("ui.common.error");
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

function setIndustry(v: Industry) {
  state.industry = v;
}

function toggleLang(l: Lang) {
  const set = new Set(state.languages_needed);
  if (set.has(l)) set.delete(l);
  else set.add(l);
  state.languages_needed = Array.from(set);

  if (!state.languages_needed.includes(state.default_language)) {
    state.default_language = state.languages_needed[0] ?? "he";
  }
}

function setDefaultLang(l: Lang) {
  if (!state.languages_needed.includes(l)) {
    state.languages_needed = Array.from(new Set([...state.languages_needed, l]));
  }
  state.default_language = l;
}

function setPrimaryGoal(g: string) {
  state.goals_primary = g;
}

function toggleSecondaryGoal(g: string) {
  const set = new Set(state.goals_secondary || []);
  if (set.has(g)) set.delete(g);
  else set.add(g);
  state.goals_secondary = Array.from(set);
}

const canGenerate = computed(
  () => state.name.trim().length > 0 && state.description.trim().length >= 10
);

const business_breif = {
  name: "Focus AI",
  description:
    "Focus AI builds AI-powered multilingual (Hebrew/Arabic/English) websites for Israeli SMBs, optimized for WhatsApp-first lead generation. The main goal is to turn visitors into WhatsApp conversations and qualified leads fast.",
  industry: "marketing_agency",
  location_market: "Israel",
  languages_needed: ["he", "ar"],
  default_language: "he",
  goals_primary: "יצירת לידים (וואטסאפ)",
  goals_secondary: ["ביקורות"],
};

async function onGenerate() {
  ui.error = "";

  // const parsed = schema.safeParse(state);
  const parsed = schema.safeParse(business_breif);
  if (!parsed.success) {
    ui.error = parsed.error.issues[0]?.message || t("onboarding.validation.incomplete");
    push("assistant", ui.error);
    return;
  }

  ui.isGenerating = true;
  push("assistant", t("onboarding.chat.generating_message"));

  try {
    // TODO: hook to your real pipeline
    const { runId } = await $fetch("/api/ai/run", { method: "POST", body: parsed.data });
    await navigateTo(
      `/generate?runId=${encodeURIComponent(runId)}&type=${encodeURIComponent(
        "strategy"
      )}`
    );
  } catch (e: any) {
    ui.error = e?.message || t("onboarding.validation.failed");
    push("assistant", `${t("ui.common.error")}: ${ui.error}`);
  } finally {
    ui.isGenerating = false;
  }
}
</script>

<template>
  <div
    class="relative min-h-[calc(100vh-0px)] w-full overflow-hidden bg-gray-50 dark:bg-gray-950"
  >
    <div class="pointer-events-none absolute inset-0 opacity-60">
      <div
        class="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gray-200 blur-3xl dark:bg-gray-900"
      />
      <div
        class="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-gray-200 blur-3xl dark:bg-gray-900"
      />
    </div>

    <div class="relative mx-auto w-full max-w-4xl px-4 py-10">
      <div class="text-center">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/70 px-3 py-1 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-300"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
          {{ t("onboarding.header.tag") }}
        </div>

        <h1
          class="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          {{ t("onboarding.title") }}
        </h1>

        <p
          class="mx-auto mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-base"
        >
          {{ t("onboarding.subtitle") }}
        </p>
      </div>

      <div class="mt-8">
        <UCard class="overflow-hidden">
          <div class="flex flex-col">
            <!-- Conversation -->
            <div class="h-[50vh] min-h-[420px] overflow-auto p-4">
              <div class="space-y-4">
                <div v-for="m in items" :key="m.id" class="space-y-2">
                  <!-- bubble -->
                  <div
                    class="flex"
                    :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
                  >
                    <div
                      class="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      :class="
                        m.role === 'user'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100'
                      "
                      style="white-space: pre-wrap"
                    >
                      {{ m.content }}
                    </div>
                  </div>

                  <!-- assistant cards INSIDE conversation (1 at a time) -->
                  <div v-if="m.role === 'assistant' && m.cards?.length" class="space-y-3">
                    <div
                      v-for="c in m.cards"
                      :key="c.id"
                      class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ c.title }}
                          </div>
                          <div
                            v-if="c.subtitle"
                            class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ c.subtitle }}
                          </div>
                        </div>

                        <UBadge
                          size="sm"
                          color="neutral"
                          variant="soft"
                          v-if="c.kind === 'industry'"
                        >
                          {{ state.industry }}
                        </UBadge>
                        <UBadge
                          size="sm"
                          color="neutral"
                          variant="soft"
                          v-else-if="c.kind === 'languages'"
                        >
                          {{
                            state.languages_needed.map((l) => l.toUpperCase()).join(" / ")
                          }}
                        </UBadge>
                        <UBadge size="sm" color="neutral" variant="soft" v-else>
                          {{ state.goals_primary || "—" }}
                        </UBadge>
                      </div>

                      <!-- Card content -->
                      <div class="mt-3">
                        <!-- Industry picker -->
                        <div v-if="c.kind === 'industry'" class="flex flex-wrap gap-2">
                          <UButton
                            v-for="i in industries"
                            :key="i.value"
                            size="sm"
                            color="neutral"
                            :variant="state.industry === i.value ? 'solid' : 'soft'"
                            :label="i.label"
                            @click="setIndustry(i.value)"
                          />
                        </div>

                        <!-- Languages picker -->
                        <div v-else-if="c.kind === 'languages'" class="space-y-3">
                          <div class="flex flex-wrap gap-2">
                            <UButton
                              size="sm"
                              color="neutral"
                              :variant="
                                state.languages_needed.includes('he') ? 'solid' : 'soft'
                              "
                              label="Hebrew (HE)"
                              @click="toggleLang('he')"
                            />
                            <UButton
                              size="sm"
                              color="neutral"
                              :variant="
                                state.languages_needed.includes('ar') ? 'solid' : 'soft'
                              "
                              label="Arabic (AR)"
                              @click="toggleLang('ar')"
                            />
                            <UButton
                              size="sm"
                              color="neutral"
                              :variant="
                                state.languages_needed.includes('en') ? 'solid' : 'soft'
                              "
                              label="English (EN)"
                              @click="toggleLang('en')"
                            />
                          </div>

                          <div>
                            <div
                              class="text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              Default language
                            </div>
                            <div class="mt-2 flex gap-2">
                              <UButton
                                size="sm"
                                color="neutral"
                                :variant="
                                  state.default_language === 'he' ? 'solid' : 'soft'
                                "
                                label="HE"
                                @click="setDefaultLang('he')"
                              />
                              <UButton
                                size="sm"
                                color="neutral"
                                :variant="
                                  state.default_language === 'ar' ? 'solid' : 'soft'
                                "
                                label="AR"
                                @click="setDefaultLang('ar')"
                              />
                              <UButton
                                size="sm"
                                color="neutral"
                                :variant="
                                  state.default_language === 'en' ? 'solid' : 'soft'
                                "
                                label="EN"
                                @click="setDefaultLang('en')"
                              />
                            </div>
                          </div>
                        </div>

                        <!-- Goals picker -->
                        <div v-else class="space-y-3">
                          <div>
                            <div
                              class="text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              Primary goal
                            </div>
                            <div class="mt-2 flex flex-wrap gap-2">
                              <UButton
                                v-for="g in goalsPrimaryPresets"
                                :key="g"
                                size="sm"
                                color="neutral"
                                :variant="state.goals_primary === g ? 'solid' : 'soft'"
                                :label="g"
                                @click="setPrimaryGoal(g)"
                              />
                            </div>
                          </div>

                          <div>
                            <div
                              class="text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                              Secondary goals
                            </div>
                            <div class="mt-2 flex flex-wrap gap-2">
                              <UButton
                                v-for="g in goalsSecondaryPresets"
                                :key="g"
                                size="sm"
                                color="neutral"
                                :variant="
                                  state.goals_secondary.includes(g) ? 'solid' : 'soft'
                                "
                                :label="g"
                                @click="toggleSecondaryGoal(g)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- actions row -->
                      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{
                            c.kind === "industry"
                              ? t("onboarding.card.pick_match")
                              : c.kind === "languages"
                              ? t("onboarding.card.choose_lang")
                              : t("onboarding.card.select_goals")
                          }}
                        </div>

                        <UButton
                          size="sm"
                          color="neutral"
                          variant="soft"
                          icon="i-lucide-check"
                          :label="t('onboarding.card.done')"
                          @click="advanceOptionCard()"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="ui.isWriting" class="flex justify-start animate-pulse">
                  <div
                    class="rounded-2xl bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    ...
                  </div>
                </div>

                <div
                  v-if="ui.error"
                  class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                >
                  {{ ui.error }}
                </div>
              </div>
            </div>

            <!-- Composer -->
            <div class="border-t border-gray-200 p-3 dark:border-gray-800">
              <div class="flex items-end gap-2">
                <UTextarea
                  v-model="ui.input"
                  :rows="2"
                  size="lg"
                  class="flex-1"
                  :placeholder="t('onboarding.chat.input_placeholder')"
                  @keydown="onKeydown"
                />
                <UButton
                  color="neutral"
                  variant="solid"
                  :disabled="!ui.input.trim().length"
                  icon="i-lucide-send"
                  @click="send"
                />

                <UButton
                  color="neutral"
                  variant="solid"
                  icon="i-lucide-send"
                  @click="onGenerate"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div
        class="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400"
      >
        <span>{{ t("onboarding.features.rtl") }}</span
        ><span>•</span><span>{{ t("onboarding.features.languages") }}</span
        ><span>•</span><span>{{ t("onboarding.features.whatsapp") }}</span
        ><span>•</span><span>{{ t("onboarding.features.seo") }}</span>
      </div>
    </div>
  </div>
</template>
