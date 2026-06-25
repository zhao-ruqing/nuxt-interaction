export default defineNuxtRouteMiddleware(async () => {
  const { data } = await useFetch('/api/auth/me')
  if (!data.value?.success) {
    return navigateTo('/auth/login')
  }
})
