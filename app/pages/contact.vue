<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const toast = useToast()

// Schema
const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(9, 'Phone number is too short'),
  message: z.string().min(10, 'Message is too short')
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  email: '',
  phone: '',
  message: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Mock submission
  console.log(event.data)
  
  toast.add({
    title: t('marketing.contact.form.success_title'),
    description: t('marketing.contact.form.success_message'),
    color: 'success'
  })

  // Reset form
  state.name = ''
  state.email = ''
  state.phone = ''
  state.message = ''
}

const contactInfo = computed(() => [
  {
    icon: 'i-heroicons-chat-bubble-left-right',
    label: t('marketing.contact.info.whatsapp_label'),
    value: '+972 50-123-4567',
    link: 'https://wa.me/972501234567',
    color: 'text-green-500'
  },
  {
    icon: 'i-heroicons-phone',
    label: t('marketing.contact.info.phone_label'),
    value: '04-123-4567',
    link: 'tel:041234567',
    color: 'text-gray-900 dark:text-white'
  },
  {
    icon: 'i-heroicons-envelope',
    label: t('marketing.contact.info.email_label'),
    value: 'info@nazareth-dental.com',
    link: 'mailto:info@nazareth-dental.com',
    color: 'text-gray-900 dark:text-white'
  },
  {
    icon: 'i-heroicons-map-pin',
    label: t('marketing.contact.info.address_label'),
    value: t('marketing.contact.info.address_value'),
    link: 'https://goo.gl/maps/placeholder',
    color: 'text-gray-900 dark:text-white'
  }
])
</script>

<template>
  <div class="py-16 md:py-24">
    <UContainer>
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
          {{ $t('marketing.contact.title') }}
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          {{ $t('marketing.contact.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <!-- Contact Form -->
        <div>
          <UCard class="bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800">
            <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
              <UFormField :label="$t('marketing.contact.form.name_label')" name="name" required>
                <UInput v-model="state.name" class="w-full" size="lg" />
              </UFormField>

              <UFormField :label="$t('marketing.contact.form.email_label')" name="email" required>
                <UInput v-model="state.email" type="email" class="w-full" size="lg" />
              </UFormField>

              <UFormField :label="$t('marketing.contact.form.phone_label')" name="phone" required>
                <UInput v-model="state.phone" type="tel" class="w-full" size="lg" />
              </UFormField>

              <UFormField :label="$t('marketing.contact.form.message_label')" name="message" required>
                <UTextarea v-model="state.message" :rows="4" class="w-full" size="lg" />
              </UFormField>

              <UButton type="submit" size="lg" block color="primary">
                {{ $t('marketing.contact.form.submit_label') }}
              </UButton>
            </UForm>
          </UCard>
        </div>

        <!-- Contact Info & Map -->
        <div class="space-y-8">
          <!-- Info List -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 space-y-6">
            <div v-for="(item, index) in contactInfo" :key="index" class="flex items-start gap-4">
              <div class="p-2 bg-white dark:bg-gray-800 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700">
                <UIcon :name="item.icon" class="w-6 h-6" :class="item.color" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ item.label }}
                </h3>
                <a 
                  v-if="item.link" 
                  :href="item.link" 
                  class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors mt-1 block"
                  target="_blank"
                >
                  {{ item.value }}
                </a>
                <p v-else class="text-gray-600 dark:text-gray-300 mt-1">
                  {{ item.value }}
                </p>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div class="rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 h-64 lg:h-80 relative bg-gray-100 dark:bg-gray-800">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3369.8787884848!2d35.2951!3d32.7019!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151c4e7cf16c177f%3A0x629197475815616!2sNazareth!5e0!3m2!1sen!2sil!4v1234567890" 
              width="100%" 
              height="100%" 
              style="border:0;" 
              allowfullscreen 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade"
              class="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
