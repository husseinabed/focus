<template>
  <UCard>
    <template #header>
      <h3 class="text-xl font-semibold leading-6 text-gray-900 dark:text-white">{{ t('settings.nav.billing') }}</h3>
    </template>

    <ul class="space-y-2">
      <li>{{ t('billing.current_plan') }}</li>
      <li>{{ t('billing.seats') }}</li>
      <li>{{ t('billing.invoices_later') }}</li>
      <li>{{ t('billing.upgrade_cta_later') }}</li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
const { t, locale } = useI18n();

useHead({
  title: t('settings.nav.billing'),
});

// Ensure RTL-readiness
watch(locale, (newLocale) => {
  if (process.client) {
    document.documentElement.setAttribute('dir', newLocale === 'ar' || newLocale === 'he' ? 'rtl' : 'ltr');
  }
}, { immediate: true });
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>
