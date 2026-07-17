/**
 * 全局管理端守卫：所有 /dashboard 路由需登录且角色为 admin
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/dashboard')) return

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
