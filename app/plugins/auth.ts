/**
 * 应用启动时预拉登录态，减少顶栏先闪「登录」再变用户名
 */
export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  if (!userStore.user) {
    await userStore.fetchUser()
  }
})
