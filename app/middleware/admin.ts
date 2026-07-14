export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const authenticated = await userStore.fetchUser()
  if (!authenticated) return navigateTo('/auth/login')
  if (userStore.user?.role !== 'admin') return navigateTo('/xingjian')
})
