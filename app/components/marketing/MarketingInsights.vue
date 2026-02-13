<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { MarketingInsightsData, VisitedSite } from '~/types/marketing'

const props = defineProps<{
  data: MarketingInsightsData
}>()

const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

// Helper to format duration
const formatDuration = (ms?: number) => {
  if (!ms) return '-'
  return `${(ms / 1000).toFixed(2)}s`
}

// Helper for status color
const getStatusColor = (status?: number | null, ok?: boolean | null) => {
  if (ok) return 'success'
  if (status === 404) return 'warning'
  if (status && status >= 500) return 'error'
  return 'neutral'
}

// Columns for the visited sites table
const visitedColumns: TableColumn<VisitedSite>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as number | null
      const ok = row.original.responseOk
      
      return h(UBadge, {
        color: getStatusColor(status, ok),
        variant: 'subtle',
        size: 'xs'
      }, () => status || 'N/A')
    }
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const url = row.getValue('url') as string
      return h('a', {
        href: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'text-primary hover:underline truncate block max-w-md',
        title: url
      }, url)
    }
  },
  {
    accessorKey: 'title',
    header: 'Page Title'
  },
  {
    accessorKey: 'timingMs',
    header: 'Load Time',
    meta: {
      class: {
        th: 'text-right',
        td: 'text-right'
      }
    },
    cell: ({ row }) => {
      const timing = row.getValue('timingMs') as number | undefined
      return h('span', { class: 'text-sm text-gray-500 font-mono' }, formatDuration(timing))
    }
  }
]

const getLanguageLabel = (lang: string) => {
  const map: Record<string, string> = {
    en: 'English',
    he: 'Hebrew',
    ar: 'Arabic'
  }
  return map[lang] || lang.toUpperCase()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Section -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-5 h-5" />
          <h3 class="text-lg font-semibold">Executive Summary</h3>
        </div>
      </template>
      <p class="text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {{ data.structure.summary }}
      </p>
    </UCard>

    <USeparator />

    <!-- Visited Sites -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-globe" class="w-5 h-5" />
          <h3 class="text-lg font-semibold">Analyzed Sources</h3>
        </div>
      </template>

      <UTable
        :data="data.structure?.market_insights?.visited || []"
        :columns="visitedColumns"
        class="max-h-96"
      />
    </UCard>

    <USeparator />

    <!-- Strategic Insights Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Competitor Patterns -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 text-primary">
            <UIcon name="i-lucide-users" class="w-5 h-5" />
            <h3 class="font-semibold">Competitor Patterns</h3>
          </div>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(pattern, i) in data.structure.market_insights?.competitor_patterns || []"
            :key="i"
            class="flex items-start gap-2"
          >
            <UIcon name="i-lucide-check" class="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
            <span class="text-sm">{{ pattern }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Positioning Angles -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 text-primary">
            <UIcon name="i-lucide-crosshair" class="w-5 h-5" />
            <h3 class="font-semibold">Positioning Angles</h3>
          </div>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(angle, i) in data.structure.market_insights?.positioning_angles_seen || []"
            :key="i"
            class="flex items-start gap-2"
          >
            <UIcon name="i-lucide-target" class="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
            <span class="text-sm">{{ angle }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Offers Seen -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 text-primary">
            <UIcon name="i-lucide-shopping-tag" class="w-5 h-5" />
            <h3 class="font-semibold">Market Offers</h3>
          </div>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(offer, i) in data.structure.market_insights?.offers_seen || []"
            :key="i"
            class="flex items-start gap-2"
          >
            <UIcon name="i-lucide-tag" class="w-4 h-4 mt-1 text-primary-500 flex-shrink-0" />
            <span class="text-sm">{{ offer }}</span>
          </li>
        </ul>
      </UCard>

      <!-- Trust Markers -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 text-primary">
            <UIcon name="i-lucide-shield-check" class="w-5 h-5" />
            <h3 class="font-semibold">Trust Markers</h3>
          </div>
        </template>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(marker, i) in data.structure.market_insights?.trust_markers_seen || []"
            :key="i"
            color="neutral"
            variant="outline"
          >
            {{ marker }}
          </UBadge>
        </div>
      </UCard>
    </div>

    <!-- CTA Patterns -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-mouse-pointer-click" class="w-5 h-5" />
          <h3 class="font-semibold">Call-to-Action Analysis</h3>
        </div>
      </template>

      <div class="space-y-4">
        <div
          v-for="(cta, i) in data.structure.market_insights?.cta_patterns || []"
          :key="i"
          class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg"
        >
          <p class="font-medium mb-2">{{ cta.pattern }}</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs text-gray-500 uppercase tracking-wider py-1">Examples:</span>
            <UBadge
              v-for="(example, j) in cta.examples"
              :key="j"
              color="primary"
              variant="subtle"
              size="xs"
            >
              {{ example }}
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Language Patterns -->
    <UCard v-if="data.structure.market_insights?.language_patterns && Object.keys(data.structure.market_insights.language_patterns).length > 0">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-languages" class="w-5 h-5" />
          <h3 class="font-semibold">Language & Tone</h3>
        </div>
      </template>

      <UTabs
        :items="Object.keys(data.structure.market_insights.language_patterns).map(lang => ({
          label: getLanguageLabel(lang),
          value: lang,
          content: data.structure.market_insights?.language_patterns?.[lang] || []
        }))"
        class="w-full"
      >
        <template #content="{ item }">
          <div class="mt-4 space-y-2">
            <div
              v-for="(pattern, i) in item.content"
              :key="i"
              class="flex items-start gap-2"
            >
              <UIcon name="i-lucide-message-square" class="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
              <span class="text-sm">{{ pattern }}</span>
            </div>
          </div>
        </template>
      </UTabs>
    </UCard>

    <!-- Risks & Gaps -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard :ui="{ header: 'bg-red-50 dark:bg-red-900/10', body: 'bg-red-50/50 dark:bg-red-900/5' }">
        <template #header>
          <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5" />
            <h3 class="font-semibold">Risk Flags</h3>
          </div>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(risk, i) in data.structure.market_insights?.risk_flags || []"
            :key="i"
            class="flex items-start gap-2 text-red-700 dark:text-red-300"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
            <span class="text-sm">{{ risk }}</span>
          </li>
        </ul>
      </UCard>

      <UCard :ui="{ header: 'bg-green-50 dark:bg-green-900/10', body: 'bg-green-50/50 dark:bg-green-900/5' }">
        <template #header>
          <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5" />
            <h3 class="font-semibold">Gaps & Opportunities</h3>
          </div>
        </template>
        <ul class="space-y-2">
          <li
            v-for="(gap, i) in data.structure.market_insights?.gaps_opportunities || []"
            :key="i"
            class="flex items-start gap-2 text-green-700 dark:text-green-300"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
            <span class="text-sm">{{ gap }}</span>
          </li>
        </ul>
      </UCard>
    </div>

    <USeparator />

    <!-- Next Steps -->
    <div class="space-y-4">
      <UAlert
        v-if="data.structure.next_inputs_needed.length > 0"
        title="Missing Inputs"
        color="warning"
        variant="subtle"
        icon="i-lucide-alert-circle"
      >
        <template #description>
          <ul class="list-disc list-inside mt-2">
            <li v-for="(input, i) in data.structure.next_inputs_needed" :key="i">
              {{ input }}
            </li>
          </ul>
        </template>
      </UAlert>

      <UAlert
        title="Verification Notes"
        color="neutral"
        variant="subtle"
        icon="i-lucide-clipboard-check"
      >
        <template #description>
          <p class="whitespace-pre-wrap">{{ data.structure.verification_notes }}</p>
        </template>
      </UAlert>
    </div>
  </div>
</template>
