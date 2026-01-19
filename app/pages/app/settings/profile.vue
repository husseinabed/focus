<template>
  <UMain>
    <UContainer>
      <div class="flex flex-col gap-4 py-8">
        <h1 class="text-2xl font-semibold">{{ $t('settings.profile.title') }}</h1>

        <!-- Profile Form -->
        <UForm :state="formState" @submit="saveProfile" class="space-y-4">
          <UFormField :label="$t('common.full_name')" name="full_name" hint="settings.profile.full_name_hint">
            <UInput v-model="formState.full_name" type="text" placeholder="John Doe" required class="w-full" />
          </UFormField>

          <UFormField :label="$t('common.email')" name="email">
            <UInput v-model="formState.email" type="email" placeholder="john.doe@example.com" readonly class="w-full" />
          </UFormField>

          <UFormField :label="$t('common.phone')" name="phone" hint="settings.profile.phone_hint">
            <UInput v-model="formState.phone" type="tel" placeholder="+1234567890" class="w-full" />
          </UFormField>

          <UFormField :label="$t('settings.profile.default_language')" name="default_language">
            <USelect v-model="formState.default_language" :items="languageOptions" class="w-full" />
          </UFormField>

          <UButton type="submit" color="primary" :label="$t('common.save_changes')" :loading="loading" />
        </UForm>

        <USeparator />

        <!-- Security Section -->
        <h2 class="text-xl font-semibold">{{ $t('settings.security.title') }}</h2>
        <div class="flex flex-col gap-2">
          <UButton color="primary" variant="outline" :label="$t('settings.profile.change_password')" @click="changePassword" />
          <UButton color="neutral" variant="outline" :label="$t('auth.sign_out')" @click="signOut" />
        </div>
      </div>
    </UContainer>
  </UMain>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useToast } from '#imports';
import { useWorkspaceStore } from '~/stores/workspace';
import type { Tables } from '~/types/supabase';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);

type Profile = Tables<'user_profiles'>;

const formState = reactive({
  full_name: '',
  email: '',
  phone: '',
  default_language: 'en',
});

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Arabic', value: 'ar' },
];

async function fetchProfile() {
  if (!user.value) return;

  loading.value = true;
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('full_name, phone, default_language')
    .eq('user_id', user.value.id)
    .returns<Profile>()
    .single();

  if (error) {
    toast.add({ title: 'Error fetching profile', description: error.message, color: 'error' });
  } else if (profile) {
    formState.full_name = profile.full_name || '';
    formState.email = user.value.email || ''; // Email from auth user
    formState.phone = profile.phone || '';
    formState.default_language = profile.default_language || 'en';
  }
  loading.value = false;
}

async function saveProfile() {
  loading.value = true;
  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: formState.full_name,
      phone: formState.phone,
      default_language: formState.default_language,
    })
    .eq('user_id', user.value?.id);

  if (error) {
    toast.add({ title: 'Error saving profile', description: error.message, color: 'error' });
  } else {
    toast.add({ title: 'Profile updated successfully', color: 'success' });
  }
  loading.value = false;
}

async function changePassword() {
  // Implement Supabase password reset flow (e.g., redirect to a reset password page)
  // For now, a placeholder toast:
  toast.add({ title: 'Change Password', description: 'Redirecting to password reset page (not yet implemented)', color: 'info' });
  // Example: navigate to a dedicated password reset page
  // await navigateTo('/auth/reset-password');
}

async function signOut() {
  loading.value = true;
  const { error } = await supabase.auth.signOut();
  if (!error) {
    workspaceStore.clear();
    await navigateTo('/login');
  } else {
    toast.add({ title: 'Error signing out', description: error.message, color: 'error' });
  }
  loading.value = false;
}

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>
