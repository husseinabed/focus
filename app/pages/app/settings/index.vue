<template>
  <UContainer>
    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
      <!-- Desktop Navigation -->
      <div class="hidden lg:block">
        <UTabs :items="desktopNavigation"   class=" w-full" v-model="selectedDesktopTabItem" @change="handleDesktopNavChange" />
      </div>

      <!-- Mobile Navigation -->
      <div class="lg:hidden">
        <UFormField label="Settings Navigation">
          <USelect
            v-model="selectedMobileNavItem"
            :options="mobileNavigationOptions"
            value-attribute="to"
            option-attribute="label_i18n"
            @change="handleMobileNavChange"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Content -->
      <div class="min-w-0">
        <slot />
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
  definePageMeta({
  layout: 'app'
})
const navigation = [
  { key: "profile", label_i18n: "settings.nav.profile", to: "/app/settings/profile", icon: "i-heroicons-user" },
  { key: "workspace", label_i18n: "settings.nav.workspace", to: "/app/settings/workspace", icon: "i-heroicons-building-office-2" },
  { key: "integrations", label_i18n: "settings.nav.integrations", to: "/app/settings/integrations", icon: "i-heroicons-link" },
  { key: "billing", label_i18n: "settings.nav.billing", to: "/app/settings/billing", icon: "i-heroicons-credit-card" }
];

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const mobileNavigationOptions = computed(() => {
  return navigation.map(item => ({
    ...item,
    label_i18n: t(item.label_i18n)
  }));
});

const selectedMobileNavItem = ref(route.path);

watch(() => route.path, (newPath) => {
  selectedMobileNavItem.value = newPath;
});

const handleMobileNavChange = () => {
  router.push(selectedMobileNavItem.value);
};

const selectedDesktopTabItem = ref(route.path);

watch(() => route.path, (newPath) => {
  selectedDesktopTabItem.value = newPath;
});

const handleDesktopNavChange = () => {
  router.push(selectedDesktopTabItem.value);
};

// For desktop navigation, map i18n labels
const desktopNavigation = computed(() => {
  return navigation.map(item => ({
    label: t(item.label_i18n),
    to: item.to,
    icon: item.icon
  }));
});
</script>
