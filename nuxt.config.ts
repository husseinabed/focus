// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Added a comment to trigger TS server refresh
  future: {
    compatibilityVersion: 4
  },

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n', '@nuxtjs/supabase', '@pinia/nuxt'],

  components: [
    { path: '~/components', extensions: ['.vue'], global: true },
    { path: '~/components/inbox', extensions: ['.vue'], global: true }
  ],
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/app(/*)?'],
      exclude: ['/', '/login', '/signup', '/confirm'],
      saveRedirectToCookie: true
    },
    types: '~/types/supabase.d.ts'
  },

  i18n: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    bundle: {
      optimizeTranslationDirective: false
    },
    langDir: 'locales',
    locales: [
      { code: 'he', language: 'he-IL', name: 'Hebrew', dir: 'rtl', file: 'he.json' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
      { code: 'ar', language: 'ar-EG', name: 'Arabic', dir: 'rtl', file: 'ar.json' }
    ],
    defaultLocale: 'he',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,


  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: ['cookie']
    }
  }
})
