<template>
  <div class="void void-dashboard">
    <div class="void-dashboard__bg">
      <div class="void-noise" />
      <div class="void-scanlines" />
      <div class="void-grid" />
    </div>

    <aside class="void-dash-sidebar">
      <NuxtLink to="/dashboard" class="void-dash-sidebar__logo">行鉴</NuxtLink>
      <nav class="void-dash-sidebar__nav">
        <NuxtLink
          to="/dashboard"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard' }"
        >概览</NuxtLink>
        <NuxtLink
          to="/dashboard/map"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/map' }"
        >地图标注</NuxtLink>
        <NuxtLink
          to="/dashboard/cities"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/cities' }"
        >行鉴城市</NuxtLink>
        <NuxtLink
          to="/dashboard/points"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/points' }"
        >行鉴点位</NuxtLink>
        <NuxtLink
          to="/dashboard/activities"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/activities' }"
        >行鉴活动</NuxtLink>
        <NuxtLink
          to="/dashboard/routes"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/routes' }"
        >行鉴路线</NuxtLink>
        <NuxtLink
          to="/dashboard/mall-products"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/mall-products' }"
        >积分商品</NuxtLink>
        <NuxtLink
          to="/dashboard/orders"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/orders' }"
        >兑换订单</NuxtLink>
        <NuxtLink
          to="/dashboard/users"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/users' }"
        >行鉴用户</NuxtLink>
        <NuxtLink
          to="/dashboard/settings"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/settings' }"
        >系统设置</NuxtLink>
        <NuxtLink
          to="/dashboard/manage-products"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/manage-products' }"
        >商品管理</NuxtLink>
        <NuxtLink
          to="/dashboard/audit-logs"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/audit-logs' }"
        >操作日志</NuxtLink>
        <NuxtLink
          to="/dashboard/personality"
          class="void-dash-sidebar__item"
          :class="{ 'is-active': route.path === '/dashboard/personality' }"
        >人格测试</NuxtLink>
      </nav>
      <div class="void-dash-sidebar__footer">
        <button class="void-dash-sidebar__logout" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <div class="void-dash-main">
      <header class="void-dash-topbar">
        <span class="void-dash-topbar__title">{{ pageTitle }}</span>
        <span class="void-dash-topbar__user">{{ userStore.user?.username }}</span>
      </header>
      <main class="void-dash-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const userStore = useUserStore();

const pageTitleMap: Record<string, string> = {
  "/dashboard": "控制台概览",
  "/dashboard/map": "地图标注",
  "/dashboard/cities": "行鉴城市管理",
  "/dashboard/points": "行鉴点位管理",
  "/dashboard/activities": "行鉴活动管理",
  "/dashboard/routes": "行鉴路线管理",
  "/dashboard/mall-products": "积分商品管理",
  "/dashboard/orders": "兑换订单管理",
  "/dashboard/users": "行鉴用户管理",
  "/dashboard/settings": "行鉴系统设置",
  "/dashboard/manage-products": "商品管理",
  "/dashboard/audit-logs": "操作日志",
  "/dashboard/personality": "人格测试",
};

const pageTitle = computed(() => pageTitleMap[route.path] ?? "控制台");

useHead({
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
    },
  ],
});

/** 挂载时拉取用户并应用暗色 body */
onMounted(() => {
  document.body.classList.add("void-dash-body");
  userStore.fetchUser();
});

/** 卸载时移除暗色 body */
onUnmounted(() => {
  document.body.classList.remove("void-dash-body");
});

/** 退出登录并返回首页 */
async function handleLogout() {
  await useFetch("/api/auth/logout", { method: "POST" });
  userStore.clearUser();
  navigateTo("/");
}
</script>
