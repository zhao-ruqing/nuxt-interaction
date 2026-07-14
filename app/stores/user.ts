export const useUserStore = defineStore('user', () => {
  const user = ref<{ id: number; username: string; role: 'user' | 'admin'; created_at?: string } | null>(null)
  const isLoggedIn = computed(() => !!user.value)

  async function fetchUser() {
    const { data } = await useFetch('/api/auth/me')
    if (data.value?.success) {
      user.value = data.value.user
    }
    return data.value?.success ?? false
  }

  function clearUser() {
    user.value = null
  }

  return { user, isLoggedIn, fetchUser, clearUser }
})
