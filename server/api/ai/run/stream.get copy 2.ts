// ~/server/api/ai//stream.get.ts
import { stream } from "~~/server/utils/stream";
import { getRun, deleteRun, cleanupRuns } from "~~/server/state/runs";
import { getProjectDataByKey, setProjectDataByKey } from "~~/server/utils/projectsStore";
import { streamDeploymentEvents } from "~~/server/ai/utils/streamDeploymentEvents";
import { researchAgent } from "~~/server/ai/agent/research";
import { strategyResearchAgent } from "~~/server/ai/agent/strategy";
import { brandStrategyAgent } from "~~/server/ai/agent/brand_strategy";
import { brandAgent } from "~~/server/ai/agent/brand";
import { UXAgent } from "~~/server/ai/agent/ux";
import { UIAgent } from "~~/server/ai/agent/ui";
import { getPlannerAgent } from "~~/server/ai/agent/planner";
import { getApplyAgent } from "~~/server/ai/agent/apply";
import { copywriteAgent } from "~~/server/ai/agent/copywrite";



const PLAN_PROMPT = `

Goal:
1) Configure Nuxt UI theme + Tailwind tokens based on brand_identity
2) Design + implement app/layouts/default.vue (default site layout)
3) Build the website pages + reusable components using ux/ui/copywriting outputs

Inputs available in context:
business_brief, market_insights, strategy, brand_strategy, brand_identity, ux, ui, copywriting

Global rules:
- Use Nuxt 4 + @nuxt/ui ^4.3.0 (NO JSX).
- Use Tailwind v4 tokens approach; keep styling consistent with brand_identity.
- Must support i18n for en/he/ar and RTL. Layout must flip correctly in RTL.
- Use copywriting as the source of truth for actual text (titles, descriptions, section copy).
- No invented claims/testimonials/metrics. If proof placeholders exist, render them as “placeholder blocks” with clear labels.
- Keep components clean, accessible, responsive, and conversion-focused (WhatsApp-first primary CTA).
- Keep implementation deterministic: only add what is needed by the UX plan and UI mapping.
- Output should compile. Avoid missing imports/modules. Prefer Nuxt core + Nuxt UI components.

Deliverables:
A) Theme + Tailwind configuration
B) Default layout implemented
C) Pages + components implemented using the provided UX/UI/Copywriting structure

========================================================
A) CONFIGURE THEME (Nuxt UI + Tailwind)
========================================================
1. Create/Update Nuxt UI theme config:
   - Add/align Nuxt UI theme to brand_identity (colors, radius, typography, shadows).
   - Define semantic tokens for: primary, secondary, accent (WhatsApp green), surface, text, muted, border.
   - Ensure dark/light mode compatibility if brand_identity includes it; otherwise implement light mode only but keep structure ready.

2. Tailwind tokens:
   - Align Tailwind config and/or CSS variables with the same semantic tokens.
   - Ensure global container widths, spacing scale, and section paddings follow a consistent rhythm.
   - Add utilities for RTL where needed (but avoid duplicating styles everywhere; handle via dir and logical properties when possible).

3. Global styles:
   - Add app/assets/css/main.css with base typography defaults and RTL-safe rules.
   - Ensure font stacks support Hebrew and Arabic. If fonts not provided, keep system fonts and add placeholders without adding new dependencies.

========================================================
B) DEFAULT LAYOUT: app/layouts/default.vue
========================================================
Implement a production-grade default layout component with:
- Header: logo/brand, primary nav (from ux sitemap), language switch (en/he/ar), primary CTA button (WhatsApp-first).
- Main: slot for page content with consistent section spacing.
- Footer: basic navigation, contact links, legal links, language switch duplicate optional, small trust microcopy if provided.
- RTL + i18n:
  - Set dir based on active locale (he/ar => rtl, en => ltr).
  - Ensure header nav alignment flips correctly.
- Accessibility:
  - Skip-to-content link, semantic landmarks, keyboard-friendly nav.
- Mobile:
  - Responsive header with hamburger menu (Nuxt UI components).
- Tracking placeholders:
  - Optional placeholders for analytics IDs (do not add real IDs).

========================================================
C) BUILD PAGES + COMPONENTS
========================================================
1. Pages (minimum):
- app/pages/index.vue (Homepage) — build sections exactly per ux + copywriting pages.home structure.
- app/pages/pricing.vue (or /plans) — if ux/copywriting includes it; otherwise create a simple “Pricing/Plans” page using placeholders.
- app/pages/contact.vue — short form + WhatsApp CTA (max 3 fields).
- app/pages/about.vue — process + trust-first explanation (no invented credentials).
- app/pages/faq.vue — render FAQs from copywriting if provided; otherwise include placeholder list.

If ux defines additional pages (services, landing pages), build them too.

2. Components:
Create reusable Nuxt components under app/components/site/* (or similar) that map to your UI plan:
- SiteHeader.vue
- SiteFooter.vue
- LanguageSwitch.vue (if not already existing)
- PrimaryCTA.vue (WhatsApp-first)
- Section.vue (standard section wrapper)
- HeroSection.vue
- BenefitsSection.vue
- HowItWorksSection.vue
- ProofSection.vue (renders proof placeholders if real proof not provided)
- ObjectionsSection.vue
- FAQSection.vue
- PricingTable.vue (placeholder-ready)
- ContactForm.vue (<= 3 fields) + validation
- TrustBar.vue (process transparency bullets)

Component constraints:
- Use Nuxt UI primitives (UContainer, UButton, UCard, UBadge, UAccordion, UModal, etc.)
- No heavy custom CSS; use tokens + utilities.
- Keep copy content pulled from copywriting JSON structure (do not hardcode text except minimal labels when missing).

3. Data wiring:
- Create a simple content adapter/composable, e.g. app/composables/useSiteCopy.ts:
  - Reads copywriting output structure and returns page section content by locale.
  - Provide safe fallbacks if some nodes are missing (but do not invent marketing claims).
- Create a navigation adapter from ux sitemap:
  - Build header/footer navigation dynamically if ux provides nav structure; otherwise use minimal Home/Pricing/Contact/About/FAQ.

4. WhatsApp-first CTA:
- Primary CTA opens WhatsApp chat link:
  - Use business_brief defaults (business name) and a locale-specific prefilled message.
  - Keep message short and professional.
- Secondary CTA routes to contact form or pricing depending on brand_strategy.

5. SEO:
- Use useHead per page with localized title/description from copywriting.seo.
- Add basic OG tags if available in strategy; otherwise minimal placeholders.

6. i18n files:
- Follow the project convention: separate locale JSON per page (en/he/ar).
- Add keys for nav, footer, CTA labels, form labels, validation messages.
- Ensure RTL languages use appropriate punctuation and do not embed long English phrases.

========================================================
Acceptance checklist (must pass):
- Project builds with Nuxt 4 + Nuxt UI v4.3.0
- default layout exists and is used
- Pages render with content in all 3 languages
- RTL works (layout flips, header/nav alignment correct)
- Primary CTA is WhatsApp-first, low friction
- No invented claims/testimonials; proof placeholders rendered when needed
- Components are reusable and match ux/ui structure
`;


export default defineEventHandler((event) =>
  stream(event, async ({ send }) => {
    const { runId, type, lang } = getQuery(event);
    const output_language = lang as string || "en-USA";

    if (!runId || typeof runId !== "string") {
      send({ type: "error", message: "missing runId" });
      return;
    }

    const run = getRun(runId);

    if (!run) {
      send({ type: "error", message: "run not found" });
      deleteRun(runId);
      return;
    }

    if (!run.body.project) {
      send({ type: "error", message: "missing project" });
      deleteRun(runId);
      return;
    }

    const project_id = run.body.project.id;

    const business_brief = await getProjectDataByKey(event, project_id, "business_brief");

    if (!business_brief) {
      send({ type: "error", message: "missing business_brief" });
      deleteRun(runId);
      return;
    }

    send({ type: "status", message: "started", payload: run.body });

    const plannerAgent = await getPlannerAgent()
    const plan = await plannerAgent.run({
      project: {
        "schema_version": "1.0.0",
        "project_type": "ai_website_generation",
        "project_name": "SmileCare Dental Clinic",
        "industry": "dental_clinic",
        "location_market": {
          "country": "Israel",
          "city": "Haifa",
          "service_radius_km": 25
        },
        "business_profile": {
          "legal_name": "SmileCare Dental Clinic Ltd.",
          "tagline": "Advanced Dental Care with a Personal Touch",
          "founded_year": 2016,
          "team_size": 8,
          "primary_contact_channel": "whatsapp",
          "phone": "+972-52-0000000",
          "email": "info@smilecare.co.il"
        },
        "services": [
          {
            "slug": "general-dentistry",
            "title": "General Dentistry",
            "description": "Routine checkups, cleanings, fillings, and preventive care.",
            "priority": 1
          },
          {
            "slug": "cosmetic-dentistry",
            "title": "Cosmetic Dentistry",
            "description": "Teeth whitening, veneers, smile design.",
            "priority": 2
          },
          {
            "slug": "dental-implants",
            "title": "Dental Implants",
            "description": "Permanent tooth replacement solutions using advanced implant systems.",
            "priority": 3
          },
          {
            "slug": "orthodontics",
            "title": "Orthodontics",
            "description": "Braces and Invisalign treatments for children and adults.",
            "priority": 4
          }
        ],
        "target_audience": {
          "primary": "Families and working professionals aged 25-55 in Haifa and surrounding areas",
          "secondary": "Parents seeking pediatric dentistry",
          "pain_points": [
            "Fear of painful dental procedures",
            "High treatment costs",
            "Long waiting times",
            "Difficulty booking appointments"
          ],
          "desired_outcomes": [
            "Pain-free treatment",
            "Transparent pricing",
            "Quick appointment scheduling",
            "Trustworthy and modern clinic"
          ]
        },
        "goals": {
          "primary_goal": "Increase appointment bookings via WhatsApp and contact forms",
          "secondary_goals": [
            "Build trust with new patients",
            "Showcase modern equipment and certifications",
            "Rank locally in Google for dental services"
          ],
          "kpis": [
            "Monthly WhatsApp inquiries",
            "Form submissions",
            "Booking conversion rate",
            "Local SEO impressions"
          ]
        },
        "languages": {
          "supported": ["he", "ar", "en"],
          "default": "he",
          "rtl_support": true,
          "auto_detect": true
        },
        "branding_preferences": {
          "tone": "Professional, calming, trustworthy",
          "visual_style": "Clean medical aesthetic with soft blues and white",
          "accent_color": "#25D366",
          "image_style": "Bright clinic photography with smiling patients",
          "logo_status": "needs_generation"
        },
        "website_structure": {
          "pages": [
            {
              "slug": "/",
              "type": "landing",
              "sections": [
                "hero",
                "services_overview",
                "about_doctor",
                "why_choose_us",
                "testimonials",
                "faq",
                "appointment_cta"
              ]
            },
            {
              "slug": "/services",
              "type": "services_listing"
            },
            {
              "slug": "/contact",
              "type": "contact_with_map"
            }
          ]
        },
        "conversion_strategy": {
          "primary_cta": {
            "type": "whatsapp",
            "label": "Book Appointment via WhatsApp",
            "sticky_mobile": true
          },
          "secondary_cta": {
            "type": "form",
            "label": "Request Callback"
          },
          "trust_elements": [
            "Doctor certifications",
            "Before/After gallery",
            "Google reviews embed",
            "Sterilization compliance badge"
          ]
        },
        "integrations": {
          "whatsapp": {
            "enabled": true,
            "prefilled_message": "Hello, I would like to book a dental appointment."
          },
          "crm": "supabase",
          "analytics": ["vercel_analytics", "google_analytics"],
          "seo": {
            "local_business_schema": true,
            "google_maps_embed": true
          }
        },
        "technical_contract": {
          "template": "focus-ai-medical-template-v1",
          "framework": "nuxt-4",
          "ui_library": "@nuxt/ui@4",
          "deployment": "vercel",
          "repo_strategy": "branch-per-fix",
          "multi_tenant": true
        }
      },
      promp: PLAN_PROMPT,

    }, send);


    send({ type: "status", message: "completed", payload: { plan } });

    deleteRun(runId);
    cleanupRuns();


  })
);
