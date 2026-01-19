<template>
  <div class="flex h-screen w-full justify-center items-center">
    <div class="text-2xl">{{ $t('welcome') }}</div>
    <div class="language-switcher mt-4">
      <ULink
        :to="$switchLocalePath('he')"
        :class="{ 'font-bold': $i18n.locale === 'he' }"
        class="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
      >
        עברית
      </ULink>
      <ULink
        :to="$switchLocalePath('en')"
        :class="{ 'font-bold': $i18n.locale === 'en' }"
        class="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
      >
        English
      </ULink>
      <ULink
        :to="$switchLocalePath('ar')"
        :class="{ 'font-bold': $i18n.locale === 'ar' }"
        class="px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
      >
        العربية
      </ULink>
    </div>
  </div>
</template>
