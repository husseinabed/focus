import { useAuth } from '~/composables/useAuth';
import { useWorkspaceStore } from '~/stores/workspace';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = await useSupabaseUser();
  const workspaceStore = useWorkspaceStore();

  // Redirect to login page if user is not authenticated
  if (!user.value) {
    return navigateTo('/login');
  }
 
  await workspaceStore.bootstrap(user.value);
 
});
