<script setup lang="ts">
import { useI18n } from "vue-i18n";
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    lang,
    dir
  }
})
</script>
<template>
  <UApp :locale="locales[locale]">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
