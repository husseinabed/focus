# Brandi Digital Marketing Site Implementation Plan

This plan details the technical implementation of the Brandi Digital marketing website based on the provided JSON specification. The site will be built using Nuxt 3, Nuxt UI, and Tailwind CSS, with a strong focus on Mobile-First design, RTL support (Hebrew/Arabic), and high conversion via WhatsApp.

## 1. Project Structure & Architecture

### Directories
*   **Pages**: `app/pages/`
    *   `index.vue`: Main Landing Page (replaces existing or refactors).
    *   `contact.vue`: Contact Page.
*   **Components**: `app/components/marketing/`
    *   All marketing-specific components will reside here to keep them separate from the application logic.
*   **Locales**: `i18n/locales/`
    *   `he.json`, `ar.json`, `en.json` will be updated with site content.

### Global Configuration
*   **RTL Support**: Managed via `@nuxtjs/i18n`. Ensure `dir` attribute is correctly set on the `<html>` tag based on the locale.
*   **Layout**: Use `app/layouts/default.vue` (or create `marketing.vue` if the app layout is too complex/restricted). *Assumption: Reuse default layout but ensure header/footer are appropriate for marketing.*

## 2. Component Mapping & implementation

### Shared Components (`app/components/marketing/`)

| Component Name | Description | Nuxt UI / Element Mapping | Notes |
| :--- | :--- | :--- | :--- |
| `HeroSection.vue` | Hero banner with title, subtitle, CTAs. | `UContainer` > `div` (flex/grid) > `h1`, `p`, `UButton` (x2) | Support background image/video. Mobile: stack vertically. RTL: reverse flex direction or rely on logical properties. |
| `FeaturesGrid.vue` | Grid for "Problem & Solution" and "Key Benefits". | `UContainer` > `div` (grid) > `UCard` (or simple div) | Grid cols: 1 (mobile) -> 2/3 (desktop). Icons: `UIcon`. |
| `ProcessSteps.vue` | Visual step-by-step flow ("How It Works"). | `UContainer` > `div` (flex/grid) | Use `USeparator` (vertical/horizontal) between steps if needed. Numbered icons. |
| `TrustSignals.vue` | Testimonials/Logos carousel. | `UCarousel` (if available) or `div` (overflow-x-auto) | Horizontal scroll for mobile. |
| `FaqSection.vue` | FAQ list. | `UAccordion` | Use `:items` prop. Custom slot for content if needed. |
| `CtaSection.vue` | Final CTA block. | `UCard` or `UContainer` > `UButton` | High contrast background. |
| `ContactForm.vue` | Lead capture form. | `UForm`, `UFormField`, `UInput`, `UTextarea`, `UButton` | **Constraint**: Use `UFormField` (not `UFormGroup`). |

### Page Implementation

#### 1. Home Page (`app/pages/index.vue`)
*   **Layout**:
    1.  `HeroSection`: "Hero Banner"
    2.  `FeaturesGrid`: "Problem & Solution" (Pain points vs Solution)
    3.  `ProcessSteps`: "How It Works" (AI Process)
    4.  `FeaturesGrid`: "Key Benefits" (AI, Speed, RTL, etc.)
    5.  `TrustSignals`: "Trust Signals" (Logos/Testimonials)
    6.  `UCard` (Simple): "About Us"
    7.  `FaqSection`: "FAQ"
    8.  `CtaSection`: "Final Call to Action"
*   **Content Keys**: `home.hero.*`, `home.problems.*`, `home.process.*`, etc.

#### 2. Contact Page (`app/pages/contact.vue`)
*   **Layout**:
    1.  `UContainer` (Header): Title + Intro ("Header")
    2.  `UContainer` (Grid):
        *   Col 1: `ContactForm`
        *   Col 2: `DirectContact` (Links & Map)
    3.  `DirectContact`: List of `UButton` (variant="link" or "ghost") for WhatsApp, Phone, Email.
    4.  `LocationMap`: Iframe or placeholder for Nazareth location.
*   **Content Keys**: `contact.header.*`, `contact.form.*`, `contact.info.*`.

## 3. Data Modeling & State

### i18n Structure
Update `i18n/locales/he.json` (and others) with a flattened or nested structure:

```json
{
  "marketing": {
    "home": {
      "hero": { "title": "...", "subtitle": "...", "cta_primary": "...", "cta_secondary": "..." },
      "problems": { "title": "...", "items": [...] },
       ...
    },
    "contact": { ... }
  }
}
```

### Form Handling
*   **Endpoint**: Create `server/api/contact.post.ts`.
*   **Logic**:
    *   Validate input (zod).
    *   (Optional) Store in Supabase `leads` table if it exists and schema matches.
    *   (Optional) Send email notification (resend/sendgrid) or simply log for now.
    *   Return success/error to UI.

## 4. Step-by-Step Implementation Guide

### Phase 1: Foundation
1.  **Setup Directories**: Ensure `app/components/marketing` exists.
2.  **Clean Index**: Backup/Refactor `app/pages/index.vue` to use the new structure.
3.  **i18n Setup**: Add the Hebrew content from the JSON spec into `i18n/locales/he.json`.

### Phase 2: Components (Iterative)
4.  **Create `HeroSection.vue`**: Implement responsive layout + RTL support.
5.  **Create `FeaturesGrid.vue`**: flexible component for both "Problems" and "Benefits".
6.  **Create `ProcessSteps.vue`**: Visual flow component.
7.  **Create `FaqSection.vue`**: Wrapper around `UAccordion`.
8.  **Create `ContactForm.vue`**: Form with validation using `UFormField` and `zod` schema.

### Phase 3: Pages Construction
9.  **Assemble Home Page**: Import and stack components in `index.vue`. Bind data from i18n.
10. **Assemble Contact Page**: Build `contact.vue` with form and info side-by-side (desktop) or stacked (mobile).

### Phase 4: Refinement
11. **RTL Check**: Verify all margins/paddings use logical properties (`ms-`, `me-`, `ps-`, `pe-`) or Tailwind RTL plugins.
12. **Mobile Check**: Verify spacing and stacking on small screens.
13. **Review Constraints**: Confirm usage of `UFormField`, `:items`, `USeparator`, etc.

## 5. Mode-Specific Constraints Checklist
*   [ ] Use `UFormField` instead of `UFormGroup`.
*   [ ] Use `USeparator` instead of `UDivider`.
*   [ ] Use `UFieldGroup` instead of `UButtonGroup` (if applicable).
*   [ ] Use `:items` prop instead of `:options`.
*   [ ] Use `color="neutral"` instead of `color="gray"`.
*   [ ] Add `"w-full"` to input components.
*   [ ] `UTable` columns definition (if used).

