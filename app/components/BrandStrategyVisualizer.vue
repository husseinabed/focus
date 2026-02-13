<script setup lang="ts">
import type { BrandStrategy } from '~/types/marketing'

const props = defineProps<{
  strategy: BrandStrategy
}>()

const items = [
  {
    label: 'Overview',
    icon: 'i-heroicons-information-circle',
    slot: 'overview'
  },
  {
    label: 'Market & Competition',
    icon: 'i-heroicons-chart-bar',
    slot: 'market'
  },
  {
    label: 'Brand Core',
    icon: 'i-heroicons-heart',
    slot: 'brand'
  },
  {
    label: 'Messaging',
    icon: 'i-heroicons-chat-bubble-left-right',
    slot: 'messaging'
  },
  {
    label: 'Marketing & Execution',
    icon: 'i-heroicons-megaphone',
    slot: 'marketing'
  }
]

// Helper function to format keys for display
const formatKey = (key: string) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Meta Information Header -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Brand Strategy</h2>
          <p class="text-sm text-gray-500">Confidence: {{ strategy.meta.confidence }}</p>
        </div>
        <div class="text-xs text-gray-400">
          v{{ strategy.meta.schema_version }}
        </div>
      </div>
      
      <div v-if="strategy.meta.assumptions.length > 0" class="mt-4">
        <p class="text-sm font-semibold mb-2">Key Assumptions:</p>
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-for="(assumption, idx) in strategy.meta.assumptions"
            :key="idx"
            color="warning"
            variant="subtle"
          >
            {{ assumption }}
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- Main Content Tabs -->
    <UTabs :items="items" class="w-full">
      
      <!-- Overview Slot -->
      <template #overview="{ item }">
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UCard class="bg-primary-50 dark:bg-primary-950/20">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-star" class="text-primary-500" />
                  <h3 class="font-semibold">Primary Position</h3>
                </div>
              </template>
              <p class="text-lg">{{ strategy.positioning_strategy.primary_position }}</p>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-sparkles" class="text-orange-500" />
                  <h3 class="font-semibold">Secondary Position</h3>
                </div>
              </template>
              <p>{{ strategy.positioning_strategy.secondary_position }}</p>
            </UCard>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <UCard>
              <template #header>
                <h3 class="font-semibold text-green-600 dark:text-green-400">Who We Are For</h3>
              </template>
              <p>{{ strategy.positioning_strategy.who_we_are_for }}</p>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold text-red-600 dark:text-red-400">Who We Are NOT For</h3>
              </template>
              <p>{{ strategy.positioning_strategy.who_we_are_not_for }}</p>
            </UCard>
          </div>
        </div>
      </template>

      <!-- Market & Competition Slot -->
      <template #market="{ item }">
        <div class="space-y-6 py-4">
          
          <!-- Market Truths -->
          <UCard>
            <template #header>
              <h3 class="font-bold text-lg">Market Truths</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 class="font-semibold mb-2 flex items-center gap-2">
                  <UIcon name="i-heroicons-light-bulb" class="text-yellow-500" />
                  Non-Obvious Insights
                </h4>
                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li v-for="(insight, idx) in strategy.market_truths.non_obvious_insights" :key="idx">
                    {{ insight }}
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 class="font-semibold mb-2 flex items-center gap-2">
                  <UIcon name="i-heroicons-eye-slash" class="text-indigo-500" />
                  Hidden Motivations
                </h4>
                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li v-for="(motivation, idx) in strategy.market_truths.hidden_customer_motivations" :key="idx">
                    {{ motivation }}
                  </li>
                </ul>
              </div>

              <div>
                <h4 class="font-semibold mb-2 flex items-center gap-2">
                  <UIcon name="i-heroicons-exclamation-triangle" class="text-red-500" />
                  Trust Breakers
                </h4>
                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li v-for="(breaker, idx) in strategy.market_truths.trust_breakers" :key="idx">
                    {{ breaker }}
                  </li>
                </ul>
              </div>
            </div>
          </UCard>

          <!-- Competitive Landscape -->
          <UCard>
            <template #header>
              <h3 class="font-bold text-lg">Competitive Landscape</h3>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 class="font-semibold mb-2 text-gray-500">Table Stakes</h4>
                <ul class="space-y-2">
                  <li v-for="(stake, idx) in strategy.competitive_landscape.table_stakes" :key="idx" class="text-sm flex items-start gap-2">
                     <UIcon name="i-heroicons-check-circle" class="text-green-500 mt-0.5 shrink-0" />
                     <span>{{ stake }}</span>
                  </li>
                </ul>
              </div>

               <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 class="font-semibold mb-2 text-gray-500">Overused Promises</h4>
                <ul class="space-y-2">
                  <li v-for="(promise, idx) in strategy.competitive_landscape.overused_promises" :key="idx" class="text-sm flex items-start gap-2">
                     <UIcon name="i-heroicons-minus-circle" class="text-orange-500 mt-0.5 shrink-0" />
                     <span>{{ promise }}</span>
                  </li>
                </ul>
              </div>

               <div class="bg-primary-50 dark:bg-primary-950/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                <h4 class="font-semibold mb-2 text-primary-600 dark:text-primary-400">Unclaimed Positions</h4>
                <ul class="space-y-2">
                  <li v-for="(position, idx) in strategy.competitive_landscape.unclaimed_positions" :key="idx" class="text-sm flex items-start gap-2">
                     <UIcon name="i-heroicons-flag" class="text-primary-500 mt-0.5 shrink-0" />
                     <span>{{ position }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Brand Core Slot -->
      <template #brand="{ item }">
        <div class="space-y-6 py-4">
          <UCard class="border-l-4 border-l-primary-500">
            <template #header>
               <h3 class="text-lg font-bold">Brand Promise</h3>
            </template>
            <p class="text-xl italic text-gray-700 dark:text-gray-200">"{{ strategy.brand_strategy.brand_promise }}"</p>
          </UCard>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UCard>
              <template #header>
                <h3 class="font-semibold">Personality Traits</h3>
              </template>
              <div class="flex flex-wrap gap-2">
                <UBadge v-for="trait in strategy.brand_strategy.personality_traits" :key="trait" color="primary" variant="soft">
                  {{ trait }}
                </UBadge>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">Trust Builders</h3>
              </template>
              <ul class="space-y-1">
                 <li v-for="builder in strategy.brand_strategy.trust_builders" :key="builder" class="text-sm flex items-center gap-2">
                    <UIcon name="i-heroicons-shield-check" class="text-green-500" />
                    {{ builder }}
                 </li>
              </ul>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="font-semibold">Emotional Triggers</h3>
              </template>
               <ul class="space-y-1">
                 <li v-for="trigger in strategy.brand_strategy.emotional_triggers" :key="trigger" class="text-sm flex items-center gap-2">
                    <UIcon name="i-heroicons-bolt" class="text-yellow-500" />
                    {{ trigger }}
                 </li>
              </ul>
            </UCard>
          </div>
        </div>
      </template>

      <!-- Messaging Slot -->
      <template #messaging="{ item }">
        <div class="space-y-6 py-4">
           <UCard class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
             <template #header>
               <h3 class="text-lg font-bold">Core Message</h3>
             </template>
             <p class="text-xl font-medium">{{ strategy.message_strategy.core_message }}</p>
           </UCard>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <UCard>
               <template #header>
                 <h3 class="font-semibold">Supporting Messages</h3>
               </template>
               <ul class="space-y-3">
                 <li v-for="(msg, idx) in strategy.message_strategy.supporting_messages" :key="idx" class="flex gap-3">
                   <div class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
                     {{ idx + 1 }}
                   </div>
                   <span>{{ msg }}</span>
                 </li>
               </ul>
             </UCard>

             <UCard>
               <template #header>
                 <h3 class="font-semibold">Objection Reframes</h3>
               </template>
               <div class="space-y-4">
                 <div v-for="(reframe, objection) in strategy.message_strategy.objection_reframes" :key="objection" class="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                   <p class="text-sm text-red-500 font-medium mb-1">"{{ objection }}"</p>
                   <div class="flex items-start gap-2">
                     <UIcon name="i-heroicons-arrow-right" class="text-gray-400 mt-1" />
                     <p class="text-sm text-green-600 dark:text-green-400 font-medium">{{ reframe }}</p>
                   </div>
                 </div>
               </div>
             </UCard>
           </div>
        </div>
      </template>

      <!-- Marketing & Execution Slot -->
      <template #marketing="{ item }">
        <div class="space-y-6 py-4">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Marketing Strategy -->
            <UCard>
              <template #header>
                <h3 class="font-bold">Marketing Strategy</h3>
              </template>
              
              <div class="space-y-4">
                <div>
                  <span class="text-sm text-gray-500 block mb-1">Conversion Focus</span>
                  <p class="font-medium">{{ strategy.marketing_strategy.conversion_focus }}</p>
                </div>
                
                 <div>
                  <span class="text-sm text-gray-500 block mb-1">CTA Philosophy</span>
                  <p class="font-medium">{{ strategy.marketing_strategy.cta_philosophy }}</p>
                </div>

                <div>
                  <span class="text-sm text-gray-500 block mb-2">Primary Channels & Rationale</span>
                   <UAccordion 
                    :items="Object.entries(strategy.marketing_strategy.channel_rationale).map(([channel, rationale]) => ({
                      label: formatKey(channel),
                      content: rationale,
                      icon: strategy.marketing_strategy.primary_channels.includes(channel) ? 'i-heroicons-check-badge' : 'i-heroicons-hashtag'
                    }))"
                  />
                </div>
              </div>
            </UCard>

            <!-- Execution Rules -->
            <div class="space-y-4">
              <UCard>
                <template #header>
                  <h3 class="font-bold">Tone of Voice</h3>
                </template>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <h4 class="text-sm font-semibold text-green-600 mb-2">DO</h4>
                    <ul class="text-sm space-y-1">
                      <li v-for="item in strategy.execution_rules.tone_of_voice.do" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-red-600 mb-2">AVOID</h4>
                    <ul class="text-sm space-y-1">
                      <li v-for="item in strategy.execution_rules.tone_of_voice.avoid" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                </div>
              </UCard>

               <UCard>
                <template #header>
                  <h3 class="font-bold">Visual Direction</h3>
                </template>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <h4 class="text-sm font-semibold text-green-600 mb-2">EMPHASIZE</h4>
                    <ul class="text-sm space-y-1">
                      <li v-for="item in strategy.execution_rules.visual_direction.emphasize" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-red-600 mb-2">AVOID</h4>
                    <ul class="text-sm space-y-1">
                      <li v-for="item in strategy.execution_rules.visual_direction.avoid" :key="item">{{ item }}</li>
                    </ul>
                  </div>
                </div>
              </UCard>
              
               <div v-if="strategy.execution_rules.strategic_no_list.length > 0" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 class="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <UIcon name="i-heroicons-no-symbol" />
                    Strategic "NO" List
                  </h4>
                  <ul class="list-disc list-inside text-sm text-red-800 dark:text-red-300">
                    <li v-for="item in strategy.execution_rules.strategic_no_list" :key="item">{{ item }}</li>
                  </ul>
               </div>

            </div>
          </div>

        </div>
      </template>
    </UTabs>
  </div>
</template>
