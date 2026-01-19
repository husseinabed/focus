<template>
  <UContainer>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div>
          <h1 class="text-2xl font-semibold">Leads</h1>
          <p class="text-[--text-muted]">Manage your leads</p>
        </div>
        <div class="flex gap-1" :class="[isRtl ? 'mr-4' : 'ml-4']">
          <UBadge
            variant="subtle"
            color="neutral"
            :label="`${aggregatedCounts.total} Total`"
          />
          <UBadge
            variant="subtle"
            color="neutral"
            :label="`${aggregatedCounts.new} New`"
          />
          <UBadge
            variant="subtle"
            color="neutral"
            :label="`${aggregatedCounts.pending_approval} Pending Approval`"
          />
          <UBadge
            variant="subtle"
            color="neutral"
            :label="`${aggregatedCounts.replied_today} Replied Today`"
          />
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          label="Scrape"
          :leading-icon="isRtl ? null : 'i-heroicons-globe-alt'"
          :trailing-icon="isRtl ? 'i-heroicons-globe-alt' : null"
          to="/app/leads/scrape"
        />
        <UButton
          label="Import"
          :leading-icon="isRtl ? null : 'i-heroicons-document-arrow-up'"
          :trailing-icon="isRtl ? 'i-heroicons-document-arrow-up' : null"
          to="/app/leads/import"
        />
        <UButton
          label="New lead"
          :leading-icon="isRtl ? null : 'i-heroicons-plus'"
          :trailing-icon="isRtl ? 'i-heroicons-plus' : null"
          to="/app/leads/new"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div class="lg:col-span-1">
        <!-- Filter Bar / Drawer for mobile -->
        <div class="sticky top-0">
          <UCard
            class="bg-[--bg-card] border border-muted rounded-xl"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold">Filters</h2>
                <UButton
                  icon="i-heroicons-funnel"
                  variant="ghost"
                  class="lg:hidden"
                  @click="openFilterDrawer = true"
                />
              </div>
            </template>
            <!-- Filter content will go here -->
            <div class="hidden lg:block">
              <UFormField label="Search">
                <UInput
                  v-model="filters.q"
                  :leading-icon="isRtl ? null : 'i-heroicons-magnifying-glass'"
                  :trailing-icon="isRtl ? 'i-heroicons-magnifying-glass' : null"
                  :placeholder="t('leads.search')"
                  color="neutral"
                />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Status">
                <div class="flex w-full gap-1">
                  <UButton
                    v-for="option in statusOptions"
                    :key="option.value"
                    :label="option.label"
                    :color="filters.status === option.value ? 'primary' : 'neutral'"
                    variant="outline"
                    class="flex-1"
                    @click="filters.status = option.value"
                  />
                </div>
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Source">
                <USelect
                  v-model="filters.source"
                  :items="sourceOptions"
                  option-attribute="label"
                  value-attribute="value"
                  color="neutral"
                />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Language">
                <USelect
                  v-model="filters.language"
                  :items="languageOptions"
                  option-attribute="label"
                  value-attribute="value"
                  color="neutral"
                />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="City">
                <UInput v-model="filters.city" placeholder="New York" color="neutral" />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Has Website">
                <USwitch v-model="filters.has_website" />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Has Phone">
                <USwitch v-model="filters.has_phone" />
              </UFormField>

              <USeparator class="my-4" />

              <UFormField label="Date Range" description="Not implemented yet">
                <UInput disabled placeholder="Coming Soon" color="neutral" />
              </UFormField>

              <UFormField label="Min Rating" description="Not implemented yet">
                <UInput disabled placeholder="Coming Soon" color="neutral" />
              </UFormField>

              <UFormField
                label="Has WhatsApp Capable"
                description="Not implemented yet"
              >
                <UInput disabled placeholder="Coming Soon" color="neutral" />
              </UFormField>
            </div>
            <UDrawer
              v-model:open="openFilterDrawer"
              :direction="isRtl ? 'left' : 'right'"
              class="lg:hidden"
            >
              <template #header>
                <div
                  class="w-full flex-none flex items-center justify-between gap-1 p-4 bg-muted/20 border-b border-zinc-200 dark:border-zinc-800"
                >
                  <UButton
                    class="aspect-square w-8"
                    :icon="isRtl ? 'i-heroicons-arrow-right' : 'i-heroicons-arrow-left'"
                    color="neutral"
                    variant="ghost"
                    @click="openFilterDrawer = false"
                  />
                  <span class="flex-1 font-semibold text-center">Filters</span>
                  <UButton
                    class="aspect-square w-8"
                    icon="i-heroicons-x-mark"
                    color="neutral"
                    variant="ghost"
                    @click="openFilterDrawer = false"
                  />
                </div>
              </template>
              <template #body>
                <div class="flex-1 overflow-y-auto p-4">
                  <UFormField label="Search">
                    <UInput
                      v-model="filters.q"
                      icon="i-heroicons-magnifying-glass"
                      :placeholder="t('leads.search')"
                      color="neutral"
                    />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Status">
                    <div class="flex w-full gap-1">
                      <UButton
                        v-for="option in statusOptions"
                        :key="option.value"
                        :label="option.label"
                        :color="filters.status === option.value ? 'primary' : 'neutral'"
                        variant="outline"
                        class="flex-1"
                        @click="filters.status = option.value"
                      />
                    </div>
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Source">
                    <USelect
                      v-model="filters.source"
                      :items="sourceOptions"
                      option-attribute="label"
                      value-attribute="value"
                      color="neutral"
                    />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Language">
                    <USelect
                      v-model="filters.language"
                      :items="languageOptions"
                      option-attribute="label"
                      value-attribute="value"
                      color="neutral"
                    />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="City">
                    <UInput v-model="filters.city" placeholder="New York" color="neutral" />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Has Website">
                    <USwitch v-model="filters.has_website" />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Has Phone">
                    <USwitch v-model="filters.has_phone" />
                  </UFormField>

                  <USeparator class="my-4" />

                  <UFormField label="Date Range" description="Not implemented yet">
                    <UInput disabled placeholder="Coming Soon" color="neutral" />
                  </UFormField>

                  <UFormField label="Min Rating" description="Not implemented yet">
                    <UInput disabled placeholder="Coming Soon" color="neutral" />
                  </UFormField>

                  <UFormField
                    label="Has WhatsApp Capable"
                    description="Not implemented yet"
                  >
                    <UInput disabled placeholder="Coming Soon" color="neutral" />
                  </UFormField>
                </div>
              </template>
            </UDrawer>
          </UCard>
        </div>
      </div>
      <div class="lg:col-span-3">
        <UCard
          class="bg-[--bg-card] border border-muted rounded-xl"
        >
          <template #header>
            <h2 class="text-lg font-semibold">Leads Table</h2>
          </template>
          <!-- Lead table will go here -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UDropdownMenu
                v-if="selectedLeads.length > 0"
                :items="bulkActions"
                popper
                :ui="{ width: 'w-48' }"
              >
                <UButton
                  icon="i-heroicons-chevron-down"
                  trailing-icon="i-heroicons-chevron-down"
                  color="neutral"
                  variant="outline"
                  class="min-w-[12ch]"
                >
                  <span class="hidden sm:block">
                    {{ selectedLeads.length }} {{ t('leads.selected') }}
                  </span>
                  <span class="block sm:hidden">{{ selectedLeads.length }}</span>
                </UButton>
              </UDropdownMenu>
              <UInput
                v-model="filters.q"
                :leading-icon="isRtl ? null : 'i-heroicons-magnifying-glass'"
                :trailing-icon="isRtl ? 'i-heroicons-magnifying-glass' : null"
                :placeholder="t('leads.search')"
                color="neutral"
                class="w-full sm:w-48"
              />
            </div>
            <div class="flex gap-2">
              <UButton
                label="Scrape"
                icon="i-heroicons-globe-alt"
                to="/app/leads/scrape"
              />
              <UButton
                label="Import"
                icon="i-heroicons-document-arrow-up"
                to="/app/leads/import"
              />
              <UButton
                label="New lead"
                icon="i-heroicons-plus"
                to="/app/leads/new"
              />
            </div>
          </div>

          <div v-if="pending">
            <div v-for="i in 10" :key="i" class="flex items-center gap-4 px-4 py-3">
              <USkeleton class="h-8 w-8" :ui="{ rounded: 'rounded-full' }" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-3/4" />
                <USkeleton class="h-4 w-1/2" />
              </div>
              <USkeleton class="h-4 w-20" />
              <USkeleton class="h-4 w-20" />
            </div>
          </div>

          <div
            v-else-if="!pending && leads.length === 0 && !hasActiveFilters && !error"
            class="py-10"
          >
            <UCard class="flex flex-col items-center justify-center p-8 text-center">
              <UIcon
                name="i-heroicons-inbox-arrow-down"
                class="w-20 h-20 text-neutral-400 mb-4"
              />
              <p class="text-2xl font-semibold mb-2">
                {{ t('leads.empty.first.title') }}
              </p>
              <p class="text-neutral-500 mb-6">
                {{ t('leads.empty.first.subtitle') }}
              </p>
              <div class="flex gap-4">
                <UButton
                  :label="t('leads.empty.first.scrape')"
                  icon="i-heroicons-globe-alt"
                  to="/app/leads/scrape"
                />
                <UButton
                  :label="t('leads.empty.first.import')"
                  icon="i-heroicons-document-arrow-up"
                  to="/app/leads/import"
                />
                <UButton
                  :label="t('leads.empty.first.new_lead')"
                  icon="i-heroicons-plus"
                  to="/app/leads/new"
                />
              </div>
            </UCard>
          </div>

          <div
            v-else-if="!pending && leads.length === 0 && hasActiveFilters && !error"
            class="py-10"
          >
            <UCard class="flex flex-col items-center justify-center p-8 text-center">
              <UIcon
                name="i-heroicons-magnifying-glass"
                class="w-20 h-20 text-neutral-400 mb-4"
              />
              <p class="text-2xl font-semibold mb-2">
                {{ t('leads.empty.filtered.title') }}
              </p>
              <p class="text-neutral-500 mb-6">
                {{ t('leads.empty.filtered.subtitle') }}
              </p>
              <UButton
                :label="t('leads.empty.filtered.clear_filters')"
                icon="i-heroicons-x-mark"
                color="primary"
                @click="clearFilters"
              />
            </UCard>
          </div>

          <div v-else-if="error" class="py-10">
            <UCard class="flex flex-col items-center justify-center p-8 text-center">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-20 h-20 text-red-500 mb-4"
              />
              <p class="text-2xl font-semibold mb-2">
                {{ t('leads.error.component_title') }}
              </p>
              <p class="text-neutral-500 mb-6">
                {{ error.message || t('leads.error.component_description') }}
              </p>
              <UButton
                :label="t('leads.error.retry')"
                icon="i-heroicons-arrow-path"
                color="primary"
                @click="refresh"
              />
            </UCard>
          </div>

          <UTable
            v-else
            v-model:row-selection="selectedLeads"
            :columns="columns"
            :rows="leads"
            density="compact"
            sticky-header
            class="w-full"
            @select="toggleRowSelection"
          >
            <template #lead-cell="{ row }">
              <div class="flex items-center gap-2">
                <div class="cursor-pointer" @click.stop="viewLeadDetails(row)">
                  <p class="font-semibold">{{ row.name }}</p>
                  <p class="text-neutral-500 dark:text-neutral-400">{{ row.company }}</p>
                  <div v-if="row.tags && row.tags.length" class="flex gap-1 mt-1">
                    <UBadge
                      v-for="tag in row.tags"
                      :key="tag"
                      :label="tag"
                      variant="subtle"
                      color="neutral"
                      size="xs"
                    />
                  </div>
                </div>
              </div>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :label="row.status"
                :color="
                  {
                    new: 'info',
                    contacted: 'primary',
                    qualified: 'success',
                    proposal: 'warning',
                    won: 'emerald',
                    lost: 'rose',
                  }[row.status] || 'neutral'
                "
                variant="subtle"
                class="capitalize"
              />
            </template>

            <template #source-cell="{ row }">
              <UBadge
                :label="row.source"
                variant="subtle"
                color="neutral"
                class="capitalize"
              />
            </template>

            <template #phone-cell="{ row }">
              <div class="flex items-center gap-2">
                <span>{{ row.phone }}</span>
                <UButton
                  v-if="row.whatsapp_capable"
                  :trailing-icon="'i-heroicons-chat-bubble-bottom-center-text'"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click.stop="
                    window.open(
                      `https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`,
                      '_blank'
                    )
                  "
                />
                <UButton
                  :trailing-icon="'i-heroicons-clipboard'"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click.stop="copy(row.phone)"
                />
              </div>
            </template>

            <template #last_activity-cell="{ row }">
              <span>{{ useTimeAgo(new Date(row.last_activity)).value }}</span>
            </template>

            <template #actions-cell="{ row }">
              <UDropdownMenu
                :items="getRowActions(row)"
                popper
                :ui="{ width: 'w-48' }"
              >
                <UButton
                  icon="i-heroicons-ellipsis-vertical"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  @click.stop
                />
              </UDropdownMenu>
            </template>
          </UTable>

          <div
            v-if="!pending && leads.length > 0"
            class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
          >
            <UPagination
              v-model:page="page"
              :page-count="pageCount"
              :total="total"
            />
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { TableColumn } from "@nuxt/ui";
import { useTimeAgo, useClipboard, useDebounceFn } from "@vueuse/core";
import { useLeads } from "~/composables/useLeads";
import type { Lead, AggregatedCounts } from "~/types/leads";


definePageMeta({
  layout: "app",
});





const route = useRoute();
const router = useRouter();
const appConfig = useAppConfig();
const { locale, t } = useI18n();
const isRtl = computed(() => ['ar', 'he'].includes(locale.value));
const toast = useToast();

const openFilterDrawer = ref(false);

const statusOptions = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal", value: "proposal" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

const sourceOptions = [
  { label: "Any", value: "any" },
  { label: "Manual", value: "manual" },
  { label: "Imported", value: "imported" },
  { label: "Scraped", value: "scraped" },
];

const languageOptions = [
  { label: "Any", value: "any" },
  { label: "English", value: "en" },
  { label: "Hebrew", value: "he" },
  { label: "Arabic", value: "ar" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const filters = ref<Record<string, string | boolean | string[]>>({
  q: (route.query.q as string) || "",
  status: (route.query.status as string) || "all",
  source: (route.query.source as string) || "any",
  language: (route.query.language as string) || "any",
  city: (route.query.city as string) || "",
  has_website: route.query.has_website === "true",
  has_phone: route.query.has_phone !== "false",
});

const page = ref(Number(route.query.page || 1));
const pageCount = ref(10); // Default page size
const sort = ref((route.query.sort as string) || "created_at desc");

const queryParams = computed(() => ({
  q: filters.value.q as string,
  status: filters.value.status as string,
  source: filters.value.source as string,
  language: filters.value.language as string,
  city: filters.value.city as string,
  has_website: filters.value.has_website as boolean,
  has_phone: filters.value.has_phone as boolean,
  page: page.value,
  pageSize: pageCount.value,
  sort: sort.value,
}));

// Helper to hash objects for useAsyncData key
function hash(obj: object) {
  return btoa(JSON.stringify(obj));
}

const lastError = ref<Error | null>(null);

const { data, pending, error, refresh } = await useAsyncData(
  `leads:list:${hash(queryParams.value)}`,
  async () => {
    try {
      const result = await useLeads(queryParams.value);
      lastError.value = null; // Clear previous errors on successful fetch
      return result;
    } catch (e) {
      lastError.value = e as Error;
      throw e;
    }
  },
  { watch: [queryParams] }
);

const leads = computed<Lead[]>(() => data.value?.leads || []);
const total = computed<number>(() => data.value?.total || 0);
const aggregatedCounts = computed<AggregatedCounts>(
  () => data.value?.aggregatedCounts || { total: 0, new: 0, pending_approval: 0, replied_today: 0 }
);

const defaultFilters = {
  q: "",
  status: "all",
  source: "any",
  language: "any",
  city: "",
  has_website: false,
  has_phone: false,
};

const hasActiveFilters = computed(() => {
  return Object.keys(filters.value).some((key) => {
    // Cast to string to ensure strict comparison with empty string
    if (key === 'q' || key === 'city') return filters.value[key] !== '';
    // Cast to string to ensure strict comparison with 'all' or 'any'
    if (key === 'status' || key === 'source' || key === 'language') return filters.value[key] !== 'all' && filters.value[key] !== 'any';
    // Check boolean filters
    if (key === 'has_website' || key === 'has_phone') return filters.value[key] === true;
    return false;
  });
});

const clearFilters = () => {
  Object.assign(filters.value, defaultFilters);
  page.value = 1;
  router.push({ query: {} });
};

watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t('leads.error.title'),
      description: newError.message || t('leads.error.description'),
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
      action: {
        label: t('leads.error.retry'),
        click: () => {
          refresh();
        },
      },
    });
  }
});


const selectedLeads = ref<Lead[]>([]);
const { copy } = useClipboard();

const columns = computed<TableColumn[]>(() => [
  {
    key: "select",
    id: "select",
    label: "",
    class: "w-12",
  },
  {
    key: "lead", // Changed id to key
    id: "lead",
    label: "Lead",
    sortable: true,
  },
  {
    key: "status",
    id: "status",
    label: "Status",
    sortable: true,
  },
  {
    key: "source",
    id: "source",
    label: "Source",
    sortable: true,
  },
  {
    key: "email",
    id: "email",
    label: "Email",
    sortable: true,
  },
  {
    key: "phone",
    id: "phone",
    label: "Phone",
    sortable: true,
  },
  {
    key: "language",
    id: "language",
    label: "Language",
    sortable: true,
  },
  {
    key: "country",
    id: "country",
    label: "Country",
    sortable: true,
  },
  {
    key: "last_activity",
    id: "last_activity",
    label: "Last Activity",
    sortable: true,
  },
  {
    key: "actions",
    id: "actions",
    label: "",
    class: "w-12",
  },
]);

const bulkActions = computed(() => [
  [
    {
      label: "Assign to workflow",
      icon: "i-heroicons-paper-airplane",
      click: () => {
        console.log("Assign to workflow", selectedLeads.value);
      },
    },
  ],
  [
    {
      label: "Delete",
      icon: "i-heroicons-trash",
      click: () => {
        console.log("Delete selected leads", selectedLeads.value);
      },
    },
  ],
]);

const viewLeadDetails = (row: Lead) => {
  router.push(`/app/leads/${row.id}`);
};

const toggleRowSelection = (row: Lead) => {
  const index = selectedLeads.value.findIndex((item) => item.id === row.id);
  if (index === -1) {
    selectedLeads.value.push(row);
  } else {
    selectedLeads.value.splice(index, 1);
  }
};

const getRowActions = (row: Lead) => {
  return [
    [
      {
        label: "Open",
        icon: "i-heroicons-eye",
        click: () => viewLeadDetails(row),
      },
      {
        label: "Inbox",
        icon: "i-heroicons-inbox",
        click: () => router.push(`/app/inbox?lead=${row.id}`),
      },
      {
        label: "Qualify",
        icon: "i-heroicons-check-badge",
        click: () => router.push(`/app/lead-qualification?lead=${row.id}`),
      },
      {
        label: "Book",
        icon: "i-heroicons-calendar",
        click: () =>
          router.push(`/app/meetings/new?lead=${row.id}&type=proposal`),
      },
    ],
    [
      {
        label: "Edit",
        icon: "i-heroicons-pencil-square",
        click: () => {
          console.log("Edit lead", row.id);
        },
      },
      {
        label: "Delete",
        icon: "i-heroicons-trash",
        click: () => {
          console.log("Delete lead", row.id);
        },
      },
    ],
  ];
};

watch(
  filters,
  useDebounceFn(
    () => {
      router.push({
        query: { ...queryParams.value, page: 1 },
      });
      refresh();
    },
    500,
    { maxWait: 1000 }
  ),
  { deep: true }
);

watch(
  page,
  () => {
    router.push({
      query: queryParams.value,
    });
    refresh();
  },
  { deep: true }
);
</script>
