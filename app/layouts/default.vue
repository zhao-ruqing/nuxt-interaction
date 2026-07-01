<template>
  <div class="default-layout">
    <header class="navbar" :class="{ scrolled: isScrolled }">
      <div class="navbar-inner">
        <NuxtLink to="/" class="logo">nuxt-interaction</NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/">首页</NuxtLink>
          <NuxtLink to="/products">饮品商城</NuxtLink>
          <NuxtLink to="/auth/login">登录</NuxtLink>
          <NuxtLink to="/auth/register" class="btn-register">注册</NuxtLink>
        </nav>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <span>&copy; {{ new Date().getFullYear() }} nuxt-interaction</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isScrolled = ref(false)

function onScroll() {
  isScrolled.value = window.scrollY > 60
}

onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped lang="scss">
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 24px;
  transition: all .3s ease;

  &.scrolled {
    background: rgba(255, 255, 255, .85);
    backdrop-filter: blur(12px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .06);
  }
}

.navbar-inner {
  max-width: $max-width;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: $primary;
  letter-spacing: -.5px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 15px;
  color: $text-secondary;

  a:hover {
    color: $text;
  }
}

.btn-register {
  background: $primary;
  color: #fff !important;
  padding: 8px 20px;
  border-radius: 8px;
  transition: background .2s;

  &:hover {
    background: $primary-dark !important;
  }
}

main {
  min-height: calc(100vh - 200px);
}

.footer {
  border-top: 1px solid $border;
  padding: 32px 24px;
}

.footer-inner {
  max-width: $max-width;
  margin: 0 auto;
  color: $text-secondary;
  font-size: 14px;
}
</style>
