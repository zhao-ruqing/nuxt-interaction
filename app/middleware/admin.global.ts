export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/dashboard')) return
  const userStore = useUserStore()
  const authenticated = await userStore.fetchUser()
  if (!authenticated) return navigateTo('/auth/login')
  if (userStore.user?.role !== 'admin') return navigateTo('/xingjian')
})
