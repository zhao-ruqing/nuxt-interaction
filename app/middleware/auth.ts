/**
 * 需登录页面守卫：未登录跳转登录页，并带上 redirect 以便登录后回跳
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
})
