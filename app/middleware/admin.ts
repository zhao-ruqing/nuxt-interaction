/**
 * 管理端命名守卫（与 admin.global 口径一致，供显式挂载时复用）
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()
  const authenticated = userStore.isLoggedIn || await userStore.fetchUser()
  if (!authenticated) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }
  if (userStore.user?.role !== 'admin') {
    return navigateTo('/xingjian')
  }
})
