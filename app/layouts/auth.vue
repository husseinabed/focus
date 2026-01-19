<script setup lang="ts">
import logo from '~/assets/images/logo.png'

const { locale, locales } = useI18n()

const localeItems = computed(() => {
  return (locales.value as any[]).map(l => ({
    label: l.name,
    value: l.code
  }))
})
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 text-start" dir="auto">
    <!-- Branding Section (Start) -->
    <div class="hidden lg:flex flex-col justify-between p-12 bg-neutral-50 dark:bg-neutral-950 border-e border-neutral-200 dark:border-neutral-800">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <img :src="logo" alt="Brandi" class="h-8 w-8" />
        <span class="font-bold text-xl text-neutral-900 dark:text-white">{{ $t('auth.brand.title') }}</span>
      </div>

      <!-- Main Message -->
      <div class="max-w-md">
        <h1 class="text-4xl font-bold mb-4 text-neutral-900 dark:text-white">{{ $t('auth.brand.title') }}</h1>
        <p class="text-xl text-neutral-500 dark:text-neutral-400">{{ $t('auth.brand.tagline') }}</p>
      </div>

      <!-- Trust Badge -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <UBadge color="neutral" variant="subtle" class="rounded-full px-2 py-1 flex items-center gap-1">
            <UIcon name="i-heroicons-shield-check" class="w-4 h-4" />
            <span>{{ $t('auth.trust.badge') }}</span>
          </UBadge>
        </div>
        <p class="text-sm text-neutral-500">{{ $t('auth.trust.note') }}</p>
      </div>
    </div>

    <!-- Content Section (End) -->
    <div class="flex flex-col justify-center items-center p-6 relative bg-white dark:bg-neutral-900">
      <!-- Language Switcher -->
      <div class="absolute top-6 end-6">
        <USelect
          v-model="locale"
          :items="localeItems"
          option-attribute="label"
          value-attribute="value"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-globe-alt"
        />
      </div>

      <!-- Mobile Header (only visible on mobile) -->
      <div class="lg:hidden w-full mb-8 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img :src="logo" alt="Brandi" class="h-6 w-6" />
          <span class="font-bold text-lg text-neutral-900 dark:text-white">{{ $t('auth.brand.title') }}</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-full max-w-sm">
        <slot />
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-xs text-neutral-400">
        <p class="mb-2">{{ $t('auth.footer.note') }}</p>
        <div class="flex justify-center items-center gap-4">
          <UButton to="#" variant="link" color="neutral" size="xs">{{ $t('auth.footer.privacy') }}</UButton>
          <USeparator orientation="vertical" class="h-3" />
          <UButton to="#" variant="link" color="neutral" size="xs">{{ $t('auth.footer.terms') }}</UButton>
          <USeparator orientation="vertical" class="h-3" />
          <UButton to="#" variant="link" color="neutral" size="xs">{{ $t('auth.footer.support') }}</UButton>
        </div>
      </div>
    </div>
  </div>
</template>
