<!--
  通用账号区链接：按登录态切换「登录 / 用户名 / 退出 / 控制台」
  用法：
    <AuthAccountLinks variant="home" />
    <AuthAccountLinks variant="void" />
    <AuthAccountLinks variant="xingjian" />
-->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 视觉变体，对齐各壳层导航样式 */
  variant?: 'home' | 'void' | 'xingjian'
  /** 是否显示退出按钮（已登录时） */
  showLogout?: boolean
}>(), {
  variant: 'xingjian',
  showLogout: true,
})

const userStore = useUserStore()
const loggingOut = ref(false)

/** 退出登录并回到首页 */
async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await userStore.logout()
    ElMessage.success('已退出登录')
    await navigateTo('/')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="auth-account" :class="`auth-account--${props.variant}`">
    <template v-if="userStore.isLoggedIn">
      <NuxtLink
        to="/profile"
        class="auth-account__user"
        :class="{ 'void-nav__cta': props.variant === 'void', 'home-nav__login': props.variant === 'home' }"
        :data-magnetic="props.variant === 'void' ? true : undefined"
      >
        {{ userStore.user?.username }}
      </NuxtLink>
      <NuxtLink
        v-if="userStore.isAdmin"
        to="/dashboard"
        class="auth-account__console"
        :class="{ 'void-nav__link': props.variant === 'void' }"
        :data-magnetic="props.variant === 'void' ? true : undefined"
      >
        控制台
      </NuxtLink>
      <button
        v-if="props.showLogout"
        type="button"
        class="auth-account__logout"
        :disabled="loggingOut"
        :data-magnetic="props.variant === 'void' ? true : undefined"
        @click="handleLogout"
      >
        {{ loggingOut ? '退出中...' : '退出' }}
      </button>
    </template>
    <NuxtLink
      v-else
      to="/auth/login"
      class="auth-account__login"
      :class="{
        'void-nav__cta': props.variant === 'void',
        'home-nav__login': props.variant === 'home',
      }"
      :data-magnetic="props.variant === 'void' ? true : undefined"
    >
      登录
    </NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.auth-account {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.auth-account__logout {
  padding: 0;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  opacity: 0.85;
  transition: opacity 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 1;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.5;
  }
}

.auth-account--home {
  color: var(--xj-muted);
  font-size: 11px;

  .auth-account__user,
  .auth-account__console,
  .auth-account__logout {
    color: var(--xj-muted);
  }

  .auth-account__user:hover,
  .auth-account__console:hover,
  .auth-account__logout:hover:not(:disabled) {
    color: var(--xj-text);
  }
}

.auth-account--xingjian {
  color: var(--xj-text-soft);
  font: 12px var(--void-mono);

  .auth-account__console {
    padding: 9px 14px;
    border: 1px solid var(--xj-border);
    border-radius: 99px;
  }

  .auth-account__logout:hover:not(:disabled) {
    color: var(--xj-accent);
  }
}

.auth-account--void {
  gap: 16px;

  .auth-account__console,
  .auth-account__logout {
    color: inherit;
  }
}
</style>
