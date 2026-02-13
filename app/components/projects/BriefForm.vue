<script setup lang="ts">
import { reactive } from 'vue'

const goalOptions = [
  { label: 'Build trust and credibility', value: 'trust' },
  { label: 'Increase brand awareness', value: 'awareness' },
  { label: 'Educate clients on AI-driven growth', value: 'education' }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Arabic', value: 'ar' }
]

const form = reactive({
  business_name: 'Focus AI',
  industry: 'Digital Marketing & AI Website Solutions',
  location_market: 'Israel (local SMBs)',
  main_service_product:
    'AI-powered multilingual websites with WhatsApp-first lead generation',
  target_audience: {
    primary:
      'Local small and medium businesses (lawyers, dentists, clinics, service providers)',
    secondary:
      'Business owners with low digital presence who rely on phone or WhatsApp'
  },
  goals: {
    primary_goal: 'Lead generation via WhatsApp and contact forms',
    secondary_goals: ['trust', 'awareness', 'education']
  },
  languages: {
    needed: ['en', 'he', 'ar'],
    default_language: 'he',
    rtl_support: true
  }
})

const submit = () => {
  console.log('submitted', form)
}
</script>

<template>
  <UForm :state="form" class="space-y-6" @submit="submit">
    <!-- Business -->
    <UFormField label="Business name" name="business_name" required>
      <UInput v-model="form.business_name"  class="w-full" />
    </UFormField>

    <UFormField label="Industry" name="industry">
      <UInput v-model="form.industry"  class="w-full" />
    </UFormField>

    <UFormField label="Market / Location" name="location_market">
      <UInput v-model="form.location_market"  class="w-full" />
    </UFormField>

    <UFormField label="Main service / product" name="main_service_product">
      <UTextarea v-model="form.main_service_product" autoresize  class="w-full" />
    </UFormField>

    <!-- Audience -->
    <UFormField label="Primary audience" name="target_audience.primary">
      <UTextarea v-model="form.target_audience.primary" autoresize  class="w-full" />
    </UFormField>

    <UFormField label="Secondary audience" name="target_audience.secondary">
      <UTextarea v-model="form.target_audience.secondary" autoresize   class="w-full" />
    </UFormField>

    <!-- Goals -->
    <UFormField label="Primary goal" name="goals.primary_goal">
      <UInput v-model="form.goals.primary_goal"  class="w-full"  />
    </UFormField>

    <UFormField label="Secondary goals" name="goals.secondary_goals">
      <USelectMenu
        v-model="form.goals.secondary_goals"
        :items="goalOptions"
        multiple
        class="w-full"
      />
    </UFormField>

    <!-- Languages -->
    <UFormField label="Languages needed" name="languages.needed">
      <USelectMenu
        v-model="form.languages.needed"
        :items="languageOptions"
        multiple
        class="w-full"
      />
    </UFormField>

    <UFormField label="Default language" name="languages.default_language">
      <USelectMenu
        v-model="form.languages.default_language"
        :items="languageOptions"
        class="w-full"
      />
    </UFormField>

 
  </UForm>
</template>
