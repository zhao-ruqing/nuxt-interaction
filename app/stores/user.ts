/**
 * 用户登录态 Store
 * 用法：const userStore = useUserStore()；页面/中间件调用 fetchUser、logout
 */
export type AuthUser = {
  id: number
  username: string
  role: 'user' | 'admin'
  created_at?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<AuthUser | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  /** 拉取当前登录用户；失败时清空本地态，避免过期 Cookie 仍显示已登录 */
  async function fetchUser() {
    try {
      const requestFetch = import.meta.server ? useRequestFetch() : $fetch
      const data = await requestFetch<{ success: boolean; user?: AuthUser }>('/api/auth/me')
      if (data?.success && data.user) {
        user.value = data.user
        return true
      }
    } catch {
      // 网络或鉴权失败均视为未登录
    }
    user.value = null
    return false
  }

  /** 登录成功后写入本地用户态 */
  function setUser(next: AuthUser) {
    user.value = next
  }

  /** 清空本地用户态 */
  function clearUser() {
    user.value = null
  }

  /** 调用退出接口并清空本地态 */
  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // 即便接口失败也清理本地态，避免卡在已登录 UI
    }
    clearUser()
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    fetchUser,
    setUser,
    clearUser,
    logout,
  }
})
