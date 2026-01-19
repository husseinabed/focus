<template>
  <UContainer>
    <h1 class="text-2xl font-semibold mb-6">{{ $t('settings.integrations.title') }}</h1>

    <!-- WhatsApp/Twilio Integration -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">{{ $t('settings.integrations.twilio.title') }}</h2>
        <UBadge :color="twilioStatus.color" variant="subtle" class="ml-2">{{ twilioStatus.text }}</UBadge>
      </template>

      <div class="space-y-4">
        <UFormField :label="$t('settings.integrations.twilio.twilio_account_sid.label')">
          <UInput
            v-model="twilioConfig.twilio_account_sid"
            type="password"
            :placeholder="$t('settings.integrations.twilio.twilio_account_sid.placeholder')"
            class="w-full"
            @focus="unmaskPassword('twilio', 'twilio_account_sid')"
            @blur="maskPassword('twilio', 'twilio_account_sid')"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.twilio.twilio_auth_token.label')">
          <UInput
            v-model="twilioConfig.twilio_auth_token"
            type="password"
            :placeholder="$t('settings.integrations.twilio.twilio_auth_token.placeholder')"
            class="w-full"
            @focus="unmaskPassword('twilio', 'twilio_auth_token')"
            @blur="maskPassword('twilio', 'twilio_auth_token')"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.twilio.twilio_whatsapp_number.label')">
          <UInput
            v-model="twilioConfig.twilio_whatsapp_number"
            :placeholder="$t('settings.integrations.twilio.twilio_whatsapp_number.placeholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.twilio.webhook_secret.label')">
          <div class="flex items-center space-x-2">
            <UInput
              v-model="twilioConfig.webhook_secret"
              type="password"
              :placeholder="$t('settings.integrations.twilio.webhook_secret.placeholder')"
              class="w-full"
              @focus="unmaskPassword('twilio', 'webhook_secret')"
              @blur="maskPassword('twilio', 'webhook_secret')"
            />
            <UButton
              icon="i-heroicons-sparkles"
              color="neutral"
              variant="ghost"
              @click="generateWebhookSecret()"
            />
          </div>
        </UFormField>

        <UFormField :label="$t('common.enabled')" name="twilio_is_enabled">
          <UCheckbox v-model="twilioConfig.is_enabled" :label="$t('settings.integrations.twilio.enabled_label')" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton color="neutral" variant="soft" @click="testIntegrationConnection('twilio')">
            {{ $t('settings.integrations.test_connection') }}
          </UButton>
          <UButton color="primary" @click="saveIntegrationConfig('twilio', twilioConfig)">
            {{ $t('common.save_changes') }}
          </UButton>
        </div>
      </template>
    </UCard>

    <USeparator class="my-6" />

    <!-- Zoom Integration -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">{{ $t('settings.integrations.zoom.title') }}</h2>
        <UBadge :color="zoomStatus.color" variant="subtle" class="ml-2">{{ zoomStatus.text }}</UBadge>
      </template>

      <div class="space-y-4">
        <UFormField :label="$t('settings.integrations.zoom.zoom_account_id.label')">
          <UInput
            v-model="zoomConfig.zoom_account_id"
            type="password"
            :placeholder="$t('settings.integrations.zoom.zoom_account_id.placeholder')"
            class="w-full"
            @focus="unmaskPassword('zoom', 'zoom_account_id')"
            @blur="maskPassword('zoom', 'zoom_account_id')"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.zoom.zoom_client_id.label')">
          <UInput
            v-model="zoomConfig.zoom_client_id"
            type="password"
            :placeholder="$t('settings.integrations.zoom.zoom_client_id.placeholder')"
            class="w-full"
            @focus="unmaskPassword('zoom', 'zoom_client_id')"
            @blur="maskPassword('zoom', 'zoom_client_id')"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.zoom.zoom_client_secret.label')">
          <UInput
            v-model="zoomConfig.zoom_client_secret"
            type="password"
            :placeholder="$t('settings.integrations.zoom.zoom_client_secret.placeholder')"
            class="w-full"
            @focus="unmaskPassword('zoom', 'zoom_client_secret')"
            @blur="maskPassword('zoom', 'zoom_client_secret')"
          />
        </UFormField>

        <UFormField :label="$t('common.enabled')" name="zoom_is_enabled">
          <UCheckbox v-model="zoomConfig.is_enabled" :label="$t('settings.integrations.zoom.enabled_label')" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton color="neutral" variant="soft" @click="testIntegrationConnection('zoom')">
            {{ $t('settings.integrations.test_connection') }}
          </UButton>
          <UButton color="primary" @click="saveIntegrationConfig('zoom', zoomConfig)">
            {{ $t('common.save_changes') }}
          </UButton>
        </div>
      </template>
    </UCard>

    <USeparator class="my-6" />

    <!-- Google Integration -->
    <UCard class="mb-6">
      <template #header>
        <h2 class="text-xl font-semibold">{{ $t('settings.integrations.google.title') }}</h2>
        <UBadge :color="googleStatus.color" variant="subtle" class="ml-2">{{ googleStatus.text }}</UBadge>
      </template>

      <div class="space-y-4">
        <UFormField :label="$t('settings.integrations.google.google_maps_api_key.label')">
          <UInput
            v-model="googleConfig.google_maps_api_key"
            type="password"
            :placeholder="$t('settings.integrations.google.google_maps_api_key.placeholder')"
            class="w-full"
            @focus="unmaskPassword('google', 'google_maps_api_key')"
            @blur="maskPassword('google', 'google_maps_api_key')"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.google.places_language.label')">
          <USelect
            v-model="googleConfig.places_language"
            :items="placesLanguageOptions"
            :placeholder="$t('settings.integrations.google.places_language.placeholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('settings.integrations.google.places_region.label')">
          <UInput
            v-model="googleConfig.places_region"
            :placeholder="$t('settings.integrations.google.places_region.placeholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('common.enabled')" name="google_is_enabled">
          <UCheckbox v-model="googleConfig.is_enabled" :label="$t('settings.integrations.google.enabled_label')" />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton color="neutral" variant="soft" @click="testIntegrationConnection('google')">
            {{ $t('settings.integrations.test_connection') }}
          </UButton>
          <UButton color="primary" @click="saveIntegrationConfig('google', googleConfig)">
            {{ $t('common.save_changes') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UContainer>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useSupabaseClient } from '#imports'
import { useWorkspace } from '~/stores/workspace'
import { useToast } from '#app' // Import useToast

const supabase = useSupabaseClient()
const workspaceStore = useWorkspace()
const workspaceId = computed(() => workspaceStore.currentWorkspace?.id)
const toast = useToast() // Initialize useToast
const { t } = useI18n() // Use i18n for toast messages

// Twilio State
const twilioConfig = reactive({
  twilio_account_sid: '',
  twilio_auth_token: '',
  twilio_whatsapp_number: '',
  webhook_secret: '',
  is_enabled: false
})
const initialTwilioConfig = reactive({ ...twilioConfig })
const twilioStatus = computed(() => getIntegrationStatus('twilio', twilioConfig, ['twilio_account_sid', 'twilio_auth_token', 'twilio_whatsapp_number']))

// Zoom State
const zoomConfig = reactive({
  zoom_account_id: '',
  zoom_client_id: '',
  zoom_client_secret: '',
  is_enabled: false
})
const initialZoomConfig = reactive({ ...zoomConfig })
const zoomStatus = computed(() => getIntegrationStatus('zoom', zoomConfig, ['zoom_account_id', 'zoom_client_id', 'zoom_client_secret']))

// Google State
const googleConfig = reactive({
  google_maps_api_key: '',
  places_language: 'he',
  places_region: 'IL',
  is_enabled: false
})
const initialGoogleConfig = reactive({ ...googleConfig })
const googleStatus = computed(() => getIntegrationStatus('google', googleConfig, ['google_maps_api_key']))

const placesLanguageOptions = [
  { label: 'Hebrew', value: 'he' },
  { label: 'Arabic', value: 'ar' },
  { label: 'English', value: 'en' }
]

const maskedValues = reactive({
  twilio: {
    twilio_account_sid: true,
    twilio_auth_token: true,
    webhook_secret: true
  },
  zoom: {
    zoom_account_id: true,
    zoom_client_id: true,
    zoom_client_secret: true
  },
  google: {
    google_maps_api_key: true
  }
})

const getIntegrationStatus = (provider, config, requiredKeys) => {
  if (!config.is_enabled) {
    return { text: 'Disabled', color: 'gray' }
  }

  const missingKeys = requiredKeys.filter(key => !config[key] || config[key] === '********')

  if (missingKeys.length > 0) {
    return { text: 'Missing Keys', color: 'red' }
  }

  return { text: 'Connected', color: 'green' }
}

const fetchIntegrations = async () => {
  if (!workspaceId.value) return

  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('provider, config, is_enabled')
    .eq('workspace_id', workspaceId.value)

  if (error) {
    console.error('Error fetching integrations:', error.message)
    toast.add({ title: t('common.error'), description: error.message, color: 'red' })
    return
  }

  data.forEach(integration => {
    const { provider, config, is_enabled } = integration
    if (provider === 'twilio') {
      Object.assign(twilioConfig, config, { is_enabled })
      Object.assign(initialTwilioConfig, config, { is_enabled })
    } else if (provider === 'zoom') {
      Object.assign(zoomConfig, config, { is_enabled })
      Object.assign(initialZoomConfig, config, { is_enabled })
    } else if (provider === 'google') {
      Object.assign(googleConfig, config, { is_enabled })
      Object.assign(initialGoogleConfig, config, { is_enabled })
    }
  })

  // Mask passwords after fetching
  maskAllPasswords()
}

const maskPassword = (provider, field) => {
  if (initialTwilioConfig[field] && provider === 'twilio') {
    twilioConfig[field] = '********'
  } else if (initialZoomConfig[field] && provider === 'zoom') {
    zoomConfig[field] = '********'
  } else if (initialGoogleConfig[field] && provider === 'google') {
    googleConfig[field] = '********'
  }
  maskedValues[provider][field] = true
}

const unmaskPassword = (provider, field) => {
  if (maskedValues[provider][field]) {
    if (provider === 'twilio') {
      twilioConfig[field] = initialTwilioConfig[field]
    } else if (provider === 'zoom') {
      zoomConfig[field] = initialZoomConfig[field]
    } else if (provider === 'google') {
      googleConfig[field] = initialGoogleConfig[field]
    }
    maskedValues[provider][field] = false
  }
}

const maskAllPasswords = () => {
  for (const provider in maskedValues) {
    for (const field in maskedValues[provider]) {
      maskPassword(provider, field)
    }
  }
}

const generateWebhookSecret = () => {
  twilioConfig.webhook_secret = crypto.randomUUID()
  maskedValues.twilio.webhook_secret = false // Show the generated secret initially
}

const saveIntegrationConfig = async (provider, configData) => {
  if (!workspaceId.value) {
    toast.add({ title: t('common.error'), description: t('settings.integrations.no_workspace'), color: 'red' })
    return
  }

  // In a real application, you would send this data to your backend API to save it securely.
  // For this task, we'll simulate an API call.
  console.log(`Saving ${provider} integration config:`, configData)

  try {
    // Simulate API call to save configuration
    const { error } = await supabase
      .from('workspace_integrations')
      .upsert({
        workspace_id: workspaceId.value,
        provider,
        config: configData,
        is_enabled: configData.is_enabled
      }, { onConflict: ['workspace_id', 'provider'] })

    if (error) {
      throw error
    }

    toast.add({ title: t('common.success'), description: t('settings.integrations.save_success', { provider }), color: 'green' })

    // Update initial config for masking and re-mask passwords
    if (provider === 'twilio') {
      Object.assign(initialTwilioConfig, configData)
    } else if (provider === 'zoom') {
      Object.assign(initialZoomConfig, configData)
    } else if (provider === 'google') {
      Object.assign(initialGoogleConfig, configData)
    }
    maskAllPasswords()
    fetchIntegrations() // Re-fetch to update statuses
  } catch (err) {
    console.error(`Error saving ${provider} integration:`, err.message)
    toast.add({ title: t('common.error'), description: t('settings.integrations.save_error', { provider, message: err.message }), color: 'red' })
  }
}

const testIntegrationConnection = async (provider) => {
  if (!workspaceId.value) {
    toast.add({ title: t('common.error'), description: t('settings.integrations.no_workspace'), color: 'red' })
    return
  }

  // In a real application, you would call your backend API to test the connection.
  // For this task, we'll simulate an API call.
  console.log(`Testing ${provider} integration connection...`)

  try {
    // Simulate API call to test connection
    const response = await $fetch(`/api/settings/integrations/${provider}/test`, {
      method: 'POST',
      body: { workspaceId: workspaceId.value }
    })

    if (response.success) {
      toast.add({ title: t('common.success'), description: t('settings.integrations.test_success', { provider }), color: 'green' })
    } else {
      throw new Error(response.message || 'Unknown error')
    }
    fetchIntegrations() // Re-fetch to update statuses
  } catch (err) {
    console.error(`Error testing ${provider} integration:`, err.message)
    toast.add({ title: t('common.error'), description: t('settings.integrations.test_error', { provider, message: err.message }), color: 'red' })
  }
}

onMounted(() => {
  fetchIntegrations()
})
</script>
