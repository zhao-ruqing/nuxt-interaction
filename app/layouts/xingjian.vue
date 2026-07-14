<template>
  <div class="xj-shell">
    <div class="xj-shell__grid" />
    <header class="xj-nav">
      <NuxtLink to="/xingjian" class="xj-brand">
        <span class="xj-brand__mark">行</span>
        <span>行鉴 XINGJIAN</span>
      </NuxtLink>
      <nav class="xj-nav__links">
        <NuxtLink to="/cities">城市</NuxtLink>
        <NuxtLink to="/checkins">打卡</NuxtLink>
        <NuxtLink to="/routes">路线</NuxtLink>
        <NuxtLink to="/activities">活动</NuxtLink>
        <NuxtLink to="/rankings">排行</NuxtLink>
        <NuxtLink to="/mall">积分商城</NuxtLink>
        <NuxtLink to="/friends">好友</NuxtLink>
        <NuxtLink to="/products">饮品商城</NuxtLink>
      </nav>
      <div class="xj-nav__account">
        <NuxtLink v-if="userStore.isLoggedIn" to="/profile">{{ userStore.user?.username }}</NuxtLink>
        <NuxtLink v-else to="/auth/login">登录</NuxtLink>
        <NuxtLink to="/dashboard" class="xj-nav__console">控制台</NuxtLink>
      </div>
    </header>
    <main class="xj-main"><slot /></main>
    <footer class="xj-footer">
      <span>行鉴 · 城市探索与文化打卡</span>
      <span>DESKTOP EXPERIENCE / MYSQL</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore()
onMounted(() => userStore.fetchUser())
useHead({
  bodyAttrs: { class: 'void-body' },
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap' }],
})
</script>

<style lang="scss">
.xj-shell { min-width: 1100px; min-height: 100vh; background: #050507; color: #f5f5f5; font-family: var(--void-display); position: relative; }
.xj-shell__grid { position: fixed; inset: 0; pointer-events: none; opacity: .2; background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 64px 64px; }
.xj-nav { height: 72px; padding: 0 42px; border-bottom: 1px solid rgba(255,255,255,.1); display: grid; grid-template-columns: 260px 1fr 220px; align-items: center; position: sticky; top: 0; z-index: 30; background: rgba(5,5,7,.9); backdrop-filter: blur(18px); }
.xj-brand { display: flex; align-items: center; gap: 12px; font-weight: 800; letter-spacing: .08em; }
.xj-brand__mark { width: 34px; height: 34px; display: grid; place-items: center; background: #f4ff58; color: #070707; border-radius: 50%; }
.xj-nav__links { display: flex; justify-content: center; gap: 30px; font-size: 14px; color: rgba(255,255,255,.58); }
.xj-nav__links a.router-link-active, .xj-nav__links a:hover { color: #f4ff58; }
.xj-nav__account { display: flex; align-items: center; justify-content: flex-end; gap: 18px; font: 12px var(--void-mono); }
.xj-nav__console { border: 1px solid rgba(255,255,255,.22); border-radius: 99px; padding: 9px 14px; }
.xj-main { position: relative; z-index: 2; min-height: calc(100vh - 150px); }
.xj-footer { position: relative; z-index: 2; display: flex; justify-content: space-between; padding: 26px 42px; border-top: 1px solid rgba(255,255,255,.08); color: rgba(255,255,255,.35); font: 11px var(--void-mono); letter-spacing: .08em; }
.xj-page { max-width: 1320px; margin: 0 auto; padding: 64px 48px 96px; }
.xj-kicker { color: #f4ff58; font: 11px var(--void-mono); letter-spacing: .24em; text-transform: uppercase; }
.xj-title { margin: 12px 0 16px; color: #f4f4f4; font-size: 52px; line-height: 1.05; }
.xj-lead { max-width: 720px; color: rgba(255,255,255,.5); line-height: 1.8; }
.xj-toolbar { display: flex; align-items: center; gap: 14px; margin: 38px 0 24px; }
.xj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.xj-card { min-height: 220px; padding: 26px; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: rgba(255,255,255,.035); transition: .25s ease; }
.xj-card:hover { border-color: rgba(244,255,88,.5); transform: translateY(-3px); }
.xj-card__meta { display: flex; justify-content: space-between; color: rgba(255,255,255,.38); font: 11px var(--void-mono); }
.xj-card h2, .xj-card h3 { color: #fff; margin: 28px 0 10px; }
.xj-card p { color: rgba(255,255,255,.48); line-height: 1.7; }
.xj-card__footer { display: flex; justify-content: space-between; align-items: center; margin-top: 26px; }
.xj-points { color: #f4ff58; font: 13px var(--void-mono); }
.xj-button { display: inline-flex; justify-content: center; align-items: center; min-height: 40px; padding: 0 18px; border: 1px solid #f4ff58; border-radius: 99px; background: #f4ff58; color: #080808; font-weight: 700; cursor: pointer; }
.xj-button--ghost { background: transparent; color: #f4ff58; }
.xj-button:disabled { opacity: .35; cursor: not-allowed; }
.xj-panel { padding: 30px; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; background: rgba(255,255,255,.03); }
.xj-empty { padding: 80px; text-align: center; color: rgba(255,255,255,.4); border: 1px dashed rgba(255,255,255,.12); border-radius: 18px; }
.xj-metric { font-size: 42px; font-weight: 800; color: #f4ff58; }
.xj-form { display: grid; gap: 16px; }
.xj-form label { color: rgba(255,255,255,.55); font-size: 13px; }
.xj-form input, .xj-form textarea, .xj-select { width: 100%; margin-top: 8px; padding: 13px 14px; color: #fff; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; outline: none; }
.xj-select { width: auto; min-width: 180px; margin: 0; }
.xj-form input:focus, .xj-form textarea:focus, .xj-select:focus { border-color: #f4ff58; }
.xj-table { width: 100%; border-collapse: collapse; }
.xj-table th, .xj-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,.08); text-align: left; }
.xj-table th { color: rgba(255,255,255,.35); font: 11px var(--void-mono); }
</style>
