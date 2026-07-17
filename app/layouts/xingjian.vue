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
        <AuthAccountLinks variant="xingjian" />
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
useHead({
  bodyAttrs: { class: 'void-body' },
  link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap' }],
})
</script>

<style lang="scss">
.xj-shell {
  position: relative;
  min-width: 1100px;
  min-height: 100vh;
  color: var(--xj-text);
  background: var(--xj-bg);
  font-family: var(--void-display);
}
.xj-shell__grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .2;
  background-image:
    linear-gradient(color-mix(in srgb, var(--xj-text) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--xj-text) 5%, transparent) 1px, transparent 1px);
  background-size: 64px 64px;
}
.xj-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 72px;
  padding: 0 42px;
  display: grid;
  grid-template-columns: 260px 1fr 220px;
  align-items: center;
  border-bottom: 1px solid var(--xj-border);
  background: color-mix(in srgb, var(--xj-bg) 90%, transparent);
  backdrop-filter: blur(18px);
}
.xj-brand { display: flex; align-items: center; gap: 12px; color: var(--xj-text); font-weight: 800; letter-spacing: .08em; }
.xj-brand__mark { width: 34px; height: 34px; display: grid; place-items: center; color: var(--xj-accent-contrast); background: var(--xj-accent-solid); border-radius: 50%; }
.xj-nav__links { display: flex; justify-content: center; gap: 30px; color: var(--xj-muted); font-size: 14px; }
.xj-nav__links a { transition: color .2s ease; }
.xj-nav__links a.router-link-active, .xj-nav__links a:hover { color: var(--xj-accent); }
.xj-nav__account { display: flex; align-items: center; justify-content: flex-end; color: var(--xj-text-soft); font: 12px var(--void-mono); }
.xj-main { position: relative; z-index: 2; min-height: calc(100vh - 150px); }
.xj-footer { position: relative; z-index: 2; display: flex; justify-content: space-between; padding: 26px 42px; color: var(--xj-muted); border-top: 1px solid var(--xj-border); font: 11px var(--void-mono); letter-spacing: .08em; }
.xj-page { max-width: 1320px; margin: 0 auto; padding: 64px 48px 96px; }
.xj-kicker { color: var(--xj-accent); font: 11px var(--void-mono); letter-spacing: .24em; text-transform: uppercase; }
.xj-title { margin: 12px 0 16px; color: var(--xj-text); font-size: 52px; line-height: 1.05; }
.xj-lead { max-width: 720px; color: var(--xj-muted); line-height: 1.8; }
.xj-toolbar { display: flex; align-items: center; gap: 14px; margin: 38px 0 24px; }
.xj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.xj-card { min-height: 220px; padding: 26px; color: var(--xj-text); border: 1px solid var(--xj-border); border-radius: 18px; background: var(--xj-surface); transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease; }
.xj-card:hover { border-color: var(--xj-border-strong); transform: translateY(-3px); box-shadow: 0 16px 40px var(--xj-accent-soft); }
.xj-card__meta { display: flex; justify-content: space-between; color: var(--xj-muted); font: 11px var(--void-mono); }
.xj-card h2, .xj-card h3 { margin: 28px 0 10px; color: var(--xj-text); }
.xj-card p { color: var(--xj-muted); line-height: 1.7; }
.xj-card__footer { display: flex; justify-content: space-between; align-items: center; margin-top: 26px; }
.xj-points { color: var(--xj-accent); font: 13px var(--void-mono); }
.xj-button { display: inline-flex; justify-content: center; align-items: center; min-height: 40px; padding: 0 18px; color: var(--xj-accent-contrast); border: 1px solid var(--xj-accent-solid); border-radius: 99px; background: var(--xj-accent-solid); font-weight: 700; cursor: pointer; transition: transform .2s ease, filter .2s ease; }
.xj-button:hover { transform: translateY(-1px); filter: brightness(.96); }
.xj-button--ghost { color: var(--xj-accent); background: transparent; border-color: var(--xj-border-strong); }
.xj-button:disabled { opacity: .35; cursor: not-allowed; transform: none; }
.xj-panel { padding: 30px; color: var(--xj-text); border: 1px solid var(--xj-border); border-radius: 20px; background: var(--xj-surface); }
.xj-empty { padding: 80px; color: var(--xj-muted); text-align: center; border: 1px dashed var(--xj-border); border-radius: 18px; }
.xj-metric { color: var(--xj-accent); font-size: 42px; font-weight: 800; }
.xj-form { display: grid; gap: 16px; }
.xj-form label { color: var(--xj-muted); font-size: 13px; }
.xj-form input, .xj-form textarea, .xj-select { width: 100%; margin-top: 8px; padding: 13px 14px; color: var(--xj-text); background: var(--xj-surface); border: 1px solid var(--xj-border); border-radius: 10px; outline: none; }
.xj-select { width: auto; min-width: 180px; margin: 0; }
.xj-form input:focus, .xj-form textarea:focus, .xj-select:focus { border-color: var(--xj-accent); box-shadow: 0 0 0 3px var(--xj-accent-soft); }
.xj-table { width: 100%; border-collapse: collapse; }
.xj-table th, .xj-table td { padding: 16px; color: var(--xj-text-soft); border-bottom: 1px solid var(--xj-border); text-align: left; }
.xj-table th { color: var(--xj-muted); font: 11px var(--void-mono); }
</style>
