import { useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/app')
  }
})
