// ~/app/config/ui.ts
// Nuxt UI v4 theme config for "Focus AI" (HE/AR/EN + RTL-ready)
// Works with @nuxt/ui (v4). If your project uses a different entry path,
// keep the object shape and move it into the config file Nuxt UI expects.

export default defineAppConfig({
  ui: {
    // ---------- Focus AI Design Tokens ----------
    // Philosophy:
    // - Blue = trust/authority
    // - Green = WhatsApp-first CTA/action
    // - Lots of whitespace, soft borders, rounded corners
    //
    // Notes:
    // - Nuxt UI v4 uses CSS variables under the hood. These tokens map well
    //   to Nuxt UI components and to Tailwind (if you alias the same vars).
    // - Keep RTL logic in i18n / dir attribute; UI tokens remain neutral.

    theme: {
      // Base radius used by most components
      radius: {
        none: "0px",
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "18px",
        xl: "22px",
        full: "9999px",
      },

      // Shadow system (soft, minimal)
      shadow: {
        none: "none",
        sm: "0 1px 2px rgba(15, 23, 42, 0.06)",
        md: "0 6px 18px rgba(15, 23, 42, 0.10)",
        lg: "0 12px 34px rgba(15, 23, 42, 0.14)",
      },

      // Typography – use your fonts via @nuxtjs/google-fonts or CSS imports.
      // Recommended:
      // - Rubik (HE/EN)
      // - Noto Sans Arabic (AR)
      font: {
        sans: "Rubik, ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      },

      // Color tokens
      // Keep these stable: they will be used everywhere (buttons, links, rings).
      colors: {
        // Brand core
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E3A8A", // Focus Blue (brand anchor)
          900: "#172554",
          950: "#0B1B3A",
        },

        // WhatsApp-first action accent
        accent: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // AI Accent / WhatsApp CTA
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },

        // Neutral scale (Slate-inspired)
        gray: {
          50: "#F8FAFC",
          100: "#F1F5F9", // Soft Gray bg
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A", // Dark Slate
          950: "#020617",
        },

        // Semantic
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          950: "#052E16",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },
      },
    },

    // ---------- Nuxt UI Component Defaults ----------
    // Keep it minimal + consistent. Prefer soft borders, rounded corners.
    components: {
      // Buttons: Primary uses Accent green, Secondary uses Blue outline.
      button: {
        default: {
          size: "md",
          color: "accent",
          variant: "solid",
        },
        // These names match common Nuxt UI patterns; adjust if your local UI build differs.
        variants: {
          solid: "font-semibold",
          soft: "font-semibold",
          outline: "font-semibold",
          ghost: "font-semibold",
        },
      },

      // Inputs: rounded, clear focus ring, light background
      input: {
        default: {
          size: "md",
          color: "primary",
          variant: "outline",
        },
      },

      textarea: {
        default: {
          size: "md",
          color: "primary",
          variant: "outline",
        },
      },

      select: {
        default: {
          size: "md",
          color: "primary",
          variant: "outline",
        },
      },

      // Cards: soft border + shadow
      card: {
        default: {
          rounded: "lg",
        },
      },

      // Badges: use semantic colors
      badge: {
        default: {
          variant: "soft",
        },
      },

      // Modal/Slideover: soft radius
      modal: {
        default: {
          rounded: "xl",
        },
      },
      slideover: {
        default: {
          rounded: "xl",
        },
      },
    },
  },
});