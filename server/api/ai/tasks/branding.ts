export const BRAND_PROMPT = `
You are a Nuxt 4 + Tailwind v4.1 + Nuxt UI v4 implementer.

Primary Goals (must complete both)
1) Align Nuxt UI v4 theme configuration with the provided brand_identity (semantic tokens + typography + RTL).
2) Redesign /app/pages/index.vue into a visual brand-identity presentation page (a living styleguide).

Scope
- You MAY edit:
  - /app/pages/index.vue
  - Nuxt UI v4 theme config files (only what’s needed to map brand_identity to semantic tokens)
  - global CSS if required for font loading / RTL base styles
- You MUST NOT:
  - rewrite other pages/components
  - add backend/API logic
  - introduce new UI libraries
  - use values not present in brand_identity

Hard Constraints
- Use ONLY values defined in brand_identity:
  - color_system (primary/secondary/accent/neutral/status)
  - radius (sm/md/lg)
  - shadow (sm/md/lg)
  - typography (scale, weights, line_height, font_families)
  - spacing (xs/sm/md/lg/xl)
- Tailwind CSS v4.1 compatible utilities only.
- Nuxt UI v4 compatible theme code only.
- EN / HE / AR support + RTL/LTR friendly layout.
- Accent color is reserved for lead-gen CTAs only (e.g., “Free Consultation”, “WhatsApp”).
- Neutral text colors are used for body/small text for readability.

Deliverables (output requirements)
- Output ONLY valid code (no explanations, no markdown).
- Provide complete final contents for EACH file you changed, in this exact format:

FILE: <path>
<full file content>

FILE: <path>
<full file content>

(Only include files you actually modified.)

Implementation Requirements

A) Nuxt UI v4 Theme Mapping
- Map brand_identity colors to Nuxt UI semantic tokens:
  - primary -> brand_identity.color_system.primary.base
  - secondary -> brand_identity.color_system.secondary.base
  - success/warning/error -> brand_identity.color_system.status.*
  - background/surface/border/text -> brand_identity.color_system.neutral.*
  - accent -> brand_identity.color_system.accent.base (but keep semantic usage controlled)
- Configure radius/shadows globally using brand_identity radius/shadow.
- Configure typography:
  - font families for latin/hebrew/arabic + fallback
  - base line-heights for headings/body
  - ensure RTL works without per-component overrides.

B) /app/pages/index.vue (Visual Brand Presentation)
Build a minimal, clean, responsive “Brand Identity Showcase” page using Nuxt UI components (preferred) or semantic HTML + Tailwind.
It must include these sections:

1) Hero / Identity
- H1 + short identity summary (use brand_identity.identity_summary)
- Primary CTA (Accent) for lead-gen
- Secondary CTA (Primary or Outline)
- Trust-first microcopy

2) Color System
- Swatches for: Primary, Secondary, Accent, Neutral (background/surface/border), Status (success/warning/error)
- Each swatch shows name + hex value.

3) Typography
- Render h1/h2/h3/body/small samples
- Include a small multilingual sample block that shows EN + HE + AR (short sentences only)
- Demonstrate correct line-heights and weights from brand_identity.typography

4) Spacing / Radius / Shadow Tokens
- Show spacing tokens visually (xs/sm/md/lg/xl) with labeled bars or blocks
- Show radius tokens (sm/md/lg) with sample cards
- Show shadow tokens (sm/md/lg) with sample cards

5) UI Patterns
- Buttons: accent (lead-gen), primary, outline/ghost
- Card example (surface + border + shadow)
- Form example (input + label + help text)
- Status alerts (success/warning/error)

6) Usage Rules Snapshot
- Render 3–5 usage_rules as compact cards (rule + rationale).

Quality Bar
- Mobile-first; looks good on desktop too.
- Clean spacing; no clutter.
- High contrast text using neutral.text_primary/text_secondary.
- No random values; everything derives from brand_identity tokens or theme semantic tokens.

Now inspect the repo, implement the theme mapping, and redesign /app/pages/index.vue accordingly.
`