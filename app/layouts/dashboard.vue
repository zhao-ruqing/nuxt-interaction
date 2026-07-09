<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <NuxtLink to="/dashboard" class="sidebar-logo">控制台</NuxtLink>
      <nav class="sidebar-nav">
        <NuxtLink
          to="/dashboard"
          class="nav-item"
          :class="{ active: route.path === '/dashboard' }"
          >概览</NuxtLink
        >
        <NuxtLink
          to="/dashboard/map"
          class="nav-item"
          :class="{ active: route.path === '/dashboard/map' }"
          >地图标注</NuxtLink
        >
        <NuxtLink
          to="/dashboard/manage-products"
          class="nav-item"
          :class="{ active: route.path === '/dashboard/manage-products' }"
          >商品管理</NuxtLink
        >
        <NuxtLink
          to="/dashboard/audit-logs"
          class="nav-item"
          :class="{ active: route.path === '/dashboard/audit-logs' }"
          >操作日志</NuxtLink
        >
        <NuxtLink
          to="/dashboard/personality"
          class="nav-item"
          :class="{ active: route.path === '/dashboard/personality' }"
          >人格测试</NuxtLink
        >
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>
    <div class="main-area">
      <header class="topbar">
        <span class="topbar-title">项目控制台</span>
        <span class="topbar-user">{{ userStore.user?.username }}</span>
      </header>
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const userStore = useUserStore();

onMounted(() => userStore.fetchUser());

async function handleLogout() {
  await useFetch("/api/auth/logout", { method: "POST" });
  userStore.clearUser();
  navigateTo("/");
}
</script>

<style scoped lang="scss">
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: $text;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
}

.sidebar-logo {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 40px;
  padding: 0 12px;
  color: #fff;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &.active {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
}

.logout-btn {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $bg-gray;
  min-height: 0;
  overflow: hidden;
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid $border;

  &-title {
    font-weight: 600;
    font-size: 15px;
  }

  &-user {
    font-size: 14px;
    color: $text-secondary;
  }
}

.content {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
}
</style>
