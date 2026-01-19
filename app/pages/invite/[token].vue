<script setup lang="ts">
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { useWorkspaceStore } from '~~/stores/workspace'

definePageMeta({
  layout: 'auth',
  middleware: 'optional_auth',
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const workspaceStore = useWorkspaceStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const errorMsg = ref<string | null>(null)
const success = ref(false)

const inviteToken = computed(() => route.params.token as string)
const storedInviteToken = useLocalStorage<string | null>('legalcms:admin:invite_token', null)

onMounted(async () => {
  if (!inviteToken.value) {
    errorMsg.value = t('invite.error.no_token')
    loading.value = false
    return
  }

  // If not logged in, store token and redirect to login
  if (!user.value) {
    storedInviteToken.value = inviteToken.value
    await router.push({ path: '/login', query: { invite: inviteToken.value } })
    return
  }

  // If logged in, proceed to accept invite
  try {
    const { data, error } = await client.rpc('accept_workspace_invite', { invite_token: inviteToken.value })

    if (error) {
      errorMsg.value = error.message
    } else if (data) {
      await workspaceStore.fetchMemberships()
      await workspaceStore.setActiveWorkspace(data as string)
      success.value = true
      storedInviteToken.value = null // Clear token after successful accept
      setTimeout(() => {
        router.push('/app')
      }, 2000) // Redirect after 2 seconds
    } else {
      errorMsg.value = t('invite.error.unknown')
    }
  } catch (e: any) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
})

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <UCard class="max-w-sm w-full bg-white/75 backdrop-blur">
    <template #header>
      <h2 class="text-2xl font-bold text-center">{{ t('invite.title') }}</h2>
    </template>

    <div v-if="loading" class="flex flex-col items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-primary-500 mb-4" />
      <p class="text-lg">{{ t('invite.loading') }}</p>
    </div>

    <div v-else-if="errorMsg" class="space-y-4">
      <UAlert icon="i-heroicons-exclamation-triangle" color="red" variant="soft" :title="t('common.error')" :description="errorMsg" />
      <div class="flex justify-center">
        <UButton @click="goToLogin" color="primary" variant="soft">
          {{ t('invite.go_to_login') }}
        </UButton>
      </div>
    </div>

    <div v-else-if="success" class="space-y-4 text-center py-8">
      <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500 mb-4" />
      <p class="text-lg font-semibold">{{ t('invite.success') }}</p>
      <p class="text-sm">{{ t('invite.redirecting') }}</p>
    </div>
  </UCard>
</template>

<i18n lang="json">
{
  "en": {
    "invite": {
      "title": "Workspace Invitation",
      "loading": "Accepting invitation...",
      "success": "Invitation accepted!",
      "redirecting": "Redirecting you to the app...",
      "error": {
        "no_token": "No invitation token provided.",
        "unknown": "An unknown error occurred while accepting the invitation."
      },
      "go_to_login": "Go to Login"
    },
    "common": {
      "error": "Error"
    }
  },
  "he": {
    "invite": {
      "title": "הזמנה למרחב עבודה",
      "loading": "מקבל את ההזמנה...",
      "success": "ההזמנה התקבלה!",
      "redirecting": "מעביר אותך ליישום...",
      "error": {
        "no_token": "לא סופק אסימון הזמנה.",
        "unknown": "אירעה שגיאה לא ידועה בעת קבלת ההזמנה."
      },
      "go_to_login": "עבור להתחברות"
    },
    "common": {
      "error": "שגיאה"
    }
  },
  "ar": {
    "invite": {
      "title": "دعوة مساحة العمل",
      "loading": "قبول الدعوة...",
      "success": "تم قبول الدعوة!",
      "redirecting": "جاري تحويلك إلى التطبيق...",
      "error": {
        "no_token": "لم يتم تقديم رمز دعوة.",
        "unknown": "حدث خطأ غير معروف أثناء قبول الدعوة."
      },
      "go_to_login": "الذهاب إلى تسجيل الدخول"
    },
    "common": {
      "error": "خطأ"
    }
  }
}
</i18n>
