<template>
  <div class="default-layout">
    <header class="navbar" :class="{ scrolled: isScrolled }">
      <div class="navbar-inner">
        <NuxtLink to="/" class="logo">行鉴 XINGJIAN</NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/">首页</NuxtLink>
          <NuxtLink to="/xingjian">行鉴</NuxtLink>
          <NuxtLink to="/products">饮品商城</NuxtLink>
          <AuthAccountLinks variant="xingjian" />
          <NuxtLink v-if="!userStore.isLoggedIn" to="/auth/register" class="btn-register">注册</NuxtLink>
        </nav>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="footer">
      <div class="footer-inner">
        <span>&copy; {{ new Date().getFullYear() }} 行鉴 XINGJIAN</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore();
const isScrolled = ref(false);

function onScroll() {
  isScrolled.value = window.scrollY > 60;
}

onMounted(() => window.addEventListener("scroll", onScroll));
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<style scoped lang="scss">
.default-layout { min-height: 100vh; color: var(--xj-text); background: var(--xj-bg); }
.navbar { position: sticky; top: 0; z-index: 100; padding: 0 42px; color: var(--xj-text); border-bottom: 1px solid var(--xj-border); background: color-mix(in srgb, var(--xj-bg) 88%, transparent); backdrop-filter: blur(18px); transition: background-color .25s ease, border-color .25s ease; }
.navbar.scrolled { background: color-mix(in srgb, var(--xj-bg) 94%, transparent); }
.navbar-inner { max-width: 1320px; height: 72px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.logo { color: var(--xj-text); font-size: 18px; font-weight: 800; letter-spacing: .08em; }
.nav-links { display: flex; align-items: center; gap: 30px; color: var(--xj-muted); font-size: 14px; }
.nav-links a { transition: color .2s ease; }.nav-links a:hover,.nav-links a.router-link-active { color: var(--xj-accent); }
.btn-register { padding: 9px 16px; color: var(--xj-accent-contrast) !important; background: var(--xj-accent-solid); border-radius: 999px; font-weight: 700; }
main { min-height: calc(100vh - 145px); }
.footer { padding: 26px 42px; color: var(--xj-muted); border-top: 1px solid var(--xj-border); }
.footer-inner { max-width: 1320px; margin: 0 auto; font: 11px var(--void-mono); letter-spacing: .08em; }
</style>
