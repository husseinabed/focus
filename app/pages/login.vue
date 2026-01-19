<script setup lang="ts">
import { z } from 'zod'
import { useLocalStorage } from '@vueuse/core'
import { useSupabaseClient } from '#imports'
import { useWorkspaceStore } from '~/stores/workspace'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only',
})

const client = useSupabaseClient()
const workspaceStore = useWorkspaceStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// SSR-safe way to access localStorage for invite token
const inviteToken = useLocalStorage<string | null>('legalcms:admin:invite_token', null)
const queryInvite = computed(() => route.query.invite as string | null)

onMounted(() => {
  if (queryInvite.value) {
    inviteToken.value = queryInvite.value
  }
})

const schema = z.object({
  email: z.string().email(t('login.validation.email_invalid')).min(1, t('login.validation.email_required')),
  password: z.string().min(6, t('login.validation.password_min')).min(1, t('login.validation.password_required')),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  email: '',
  password: '',
})

async function onSubmit() {
  loading.value = true
  errorMsg.value = null

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    })

    if (error) {
      errorMsg.value = error.message
    } else {
      await workspaceStore.bootstrap(data.user)

      if (inviteToken.value) {
        const tokenToUse = inviteToken.value
        inviteToken.value = null // Clear token after use attempt
        await router.push(`/invite/${tokenToUse}`)
      } else if (workspaceStore.hasWorkspace) {
        await router.push('/app')
      } else {
        await router.push('/app/settings') // Or '/app/workspaces' if a chooser page exists
      }
    }
  } catch (e: any) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="max-w-sm w-full bg-white/75 backdrop-blur">
    <template #header>
      <h2 class="text-2xl font-bold text-center">{{ t('login.title') }}</h2>
    </template>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField :label="t('login.email_label')" name="email">
        <UInput v-model="state.email" type="email" :placeholder="t('login.email_placeholder')" icon="i-heroicons-envelope" class="w-full"/>
      </UFormField>

      <UFormField :label="t('login.password_label')" name="password">
        <UInput v-model="state.password" type="password" :placeholder="t('login.password_placeholder')" icon="i-heroicons-lock-closed" class="w-full" />
      </UFormField>

      <UAlert v-if="errorMsg" icon="i-heroicons-exclamation-triangle" color="error" variant="soft" :title="t('common.error')" :description="errorMsg" />

      <UButton type="submit" block :loading="loading" :disabled="loading">
        {{ t('login.button') }}
      </UButton>

      <USeparator />

      <!-- Optional: Go to signup -->
      <!-- <div class="text-center text-sm">
        {{ t('login.no_account') }} <ULink to="/signup" class="font-medium">{{ t('login.signup_link') }}</ULink>
      </div> -->
    </UForm>
  </UCard>
</template>

<i18n lang="json">
{
  "en": {
    "login": {
      "title": "Login to your account",
      "email_label": "Email",
      "email_placeholder": "Enter your email",
      "password_label": "Password",
      "password_placeholder": "Enter your password",
      "button": "Login",
      "no_account": "Don't have an account?",
      "signup_link": "Sign up",
      "validation": {
        "email_required": "Email is required",
        "email_invalid": "Invalid email address",
        "password_required": "Password is required",
        "password_min": "Password must be at least 6 characters"
      }
    },
    "common": {
      "error": "Error"
    }
  },
  "he": {
    "login": {
      "title": "התחבר לחשבונך",
      "email_label": "אימייל",
      "email_placeholder": "הכנס אימייל",
      "password_label": "סיסמה",
      "password_placeholder": "הכנס סיסמה",
      "button": "התחבר",
      "no_account": "אין לך חשבון?",
      "signup_link": "הירשם",
      "validation": {
        "email_required": "אימייל נדרש",
        "email_invalid": "כתובת אימייל לא חוקית",
        "password_required": "סיסמה נדרשת",
        "password_min": "הסיסמה חייבת להיות לפחות 6 תווים"
      }
    },
    "common": {
      "error": "שגיאה"
    }
  },
  "ar": {
    "login": {
      "title": "تسجيل الدخول إلى حسابك",
      "email_label": "البريد الإلكتروني",
      "email_placeholder": "أدخل بريدك الإلكتروني",
      "password_label": "كلمة المرور",
      "password_placeholder": "أدخل كلمة المرور",
      "button": "تسجيل الدخول",
      "no_account": "ليس لديك حساب؟",
      "signup_link": "سجل الآن",
      "validation": {
        "email_required": "البريد الإلكتروني مطلوب",
        "email_invalid": "عنوان بريد إلكتروني غير صالح",
        "password_required": "كلمة المرور مطلوبة",
        "password_min": "يجب أن تكون كلمة المرور 6 أحرف على الأقل"
      }
    }
  }
}
</i18n>
