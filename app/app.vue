<script setup lang="ts">
import * as uiLocales from "@nuxt/ui/locale";

const { locale, locales } = useI18n();

const lang = computed(() => locales.value.find(l => l.code === locale.value)?.language)
const dir = computed(() => locales.value.find(l => l.code === locale.value)?.dir)

useHead({
  htmlAttrs: {
    lang,
    dir
  },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Rubik:wght@300;400;500;700&display=swap' }
  ],
  bodyAttrs: {
    class: 'font-sans'
  }
})
</script>
<template>
  <UApp :locale="uiLocales[locale] || uiLocales.en">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
