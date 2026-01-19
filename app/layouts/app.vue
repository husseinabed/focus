<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "~/composables/useAuth";

const route = useRoute();
const { locale } = useI18n();
const { signOut } = useAuth();
const router = useRouter();

const isRtl = computed(() => ["he", "ar"].includes(locale.value));
useHead(() => ({ htmlAttrs: { dir: isRtl.value ? "rtl" : "ltr" } }));

const sidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false;
  }
);

const nav = [
  {
    to: "/app",
    key: "dashboard",
    icon: "i-heroicons-squares-2x2",
    label: "nav.dashboard",
  },
  { to: "/app/leads", key: "leads", icon: "i-heroicons-user-group", label: "nav.leads" },
  {
    to: "/app/inbox",
    key: "inbox",
    icon: "i-heroicons-chat-bubble-left-right",
    label: "nav.inbox",
  },
  {
    to: "/app/approvals",
    key: "approvals",
    icon: "i-heroicons-check-badge",
    label: "nav.approvals",
  },
  {
    to: "/app/workflows",
    key: "workflows",
    icon: "i-heroicons-cube-transparent",
    label: "nav.workflows",
  },
  {
    to: "/app/templates",
    key: "templates",
    icon: "i-heroicons-document-text",
    label: "nav.templates",
  },
  {
    to: "/app/meetings",
    key: "meetings",
    icon: "i-heroicons-calendar-days",
    label: "nav.meetings",
  },
  {
    to: "/app/settings",
    key: "settings",
    icon: "i-heroicons-cog-6-tooth",
    label: "nav.settings",
  },
];
</script>

<template>
  <div class="min-h-[100dvh] bg-[--bg-app] text-[--text-primary]">
    <!-- Mobile drawer -->
    <USlideover v-model="sidebarOpen" :side="isRtl ? 'right' : 'left'" class="lg:hidden">
      <div class="h-full w-[320px] bg-[--bg-card] border-e border-muted">
        <div class="px-2 py-2">
          <WorkspaceSelector />
        </div>

        <nav class="px-2 space-y-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.key"
            :to="item.to"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[--bg-muted]"
            :class="route.path === item.to ? 'bg-[--bg-muted] font-medium' : ''"
          >
            <UIcon :name="item.icon" class="h-4 w-4" />
            <span>{{ $t(item.label) }}</span>
          </NuxtLink>
        </nav>
      </div>
    </USlideover>

    <!-- Desktop grid -->
    <div class="grid min-h-[100dvh] lg:grid-cols-[320px_1fr]">
      <!-- Sidebar desktop -->
      <aside
        class="hidden lg:flex lg:flex-col bg-[--bg-card] border-e border-muted"
      >
        <div class="px-2 py-2">
          <WorkspaceSelector />
        </div>

        <nav class="px-2 space-y-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.key"
            :to="item.to"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[--bg-muted]"
            :class="route.path === item.to ? 'bg-[--bg-muted] font-medium' : ''"
          >
            <UIcon :name="item.icon" class="h-4 w-4" />
            <span>{{ $t(item.label) }}</span>
          </NuxtLink>
        </nav>

        <UButton
          icon="i-heroicons-arrow-left-on-rectangle"
          color="neutral"
          variant="ghost"
          class="w-full mt-auto mb-3"
          @click="async () => { await signOut(); await router.push('/login'); }"
        >
          {{ $t("auth.signOut", "Sign Out") }}
        </UButton>

        <div
          class="border-t border-muted p-3 text-xs text-[--text-muted]"
        >
          {{ $t("app.sidebar.footer", "Nothing is sent without approval.") }}
        </div>
      </aside>

      <!-- Main -->
      <div class="min-h-0 flex flex-col">
        <!-- Topbar -->
        <header
          class="h-[64px] bg-[--bg-card] border-b border-muted px-4 lg:px-6 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <UButton
              icon="i-heroicons-bars-3"
              color="neutral"
              variant="ghost"
              class="lg:hidden"
              @click="sidebarOpen = true"
            />
            <div class="text-sm font-semibold">
              {{ $t("app.title", "Brandi Digital") }}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" />
            <UAvatar text="JD" size="sm" />
          </div>
        </header>

        <!-- Content -->
        <main class="min-h-0 flex-1 overflow-y-auto">
          <div class="max-w-[--container-max] mx-auto p-4 lg:p-6">
            <NuxtPage />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
