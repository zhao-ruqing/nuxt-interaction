<template>
  <div class="dashboard-page">
    <h2>欢迎回来，{{ userStore.user?.username }}</h2>
    <p class="welcome-text">这是你的项目控制台，一切从这里开始。</p>

    <div class="info-cards">
      <div class="info-card">
        <div class="card-label">用户名</div>
        <div class="card-value">{{ userStore.user?.username }}</div>
      </div>
      <div class="info-card">
        <div class="card-label">注册时间</div>
        <div class="card-value">{{ formatDate(userStore.user?.created_at) }}</div>
      </div>
      <div class="info-card">
        <div class="card-label">项目数</div>
        <div class="card-value">1</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const userStore = useUserStore()

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped lang="scss">
.dashboard-page {
  max-width: 800px;
}

h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.welcome-text {
  color: $text-secondary;
  margin-bottom: 32px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-card {
  background: #fff;
  border-radius: $radius;
  padding: 24px;
  box-shadow: $shadow;

  .card-label {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: $text;
  }
}
</style>
