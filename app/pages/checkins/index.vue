<template>
  <div class="xj-page">
    <span class="xj-kicker">CHECK-IN POINTS</span><h1 class="xj-title">城市点位</h1>
    <p class="xj-lead">桌面端当前采用基础打卡闭环：登录后每天可在同一地点打卡一次，服务端以 MySQL 唯一约束防止重复积分。</p>
    <div class="xj-toolbar">
      <select v-model="cityId" class="xj-select"><option value="">全部城市</option><option v-for="city in cities" :key="city.id" :value="String(city.id)">{{ city.name }}</option></select>
      <input v-model="keyword" class="xj-select" placeholder="搜索点位或地址" @keyup.enter="refreshPoints">
      <button class="xj-button xj-button--ghost" @click="refreshPoints">查询</button>
    </div>
    <div v-if="points.length" class="xj-grid">
      <article v-for="point in points" :key="point.id" class="xj-card">
        <div class="xj-card__meta"><span>{{ point.cityName }} / {{ point.category }}</span><span>{{ point.checkinCount }} 次记录</span></div>
        <h2>{{ point.name }}</h2><p>{{ point.address }}</p><p>{{ point.description }}</p>
        <div class="xj-card__footer">
          <span class="xj-points">+{{ point.pointsReward }} PTS</span>
          <div style="display:flex;gap:10px"><NuxtLink class="xj-button xj-button--ghost" :to="`/checkins/${point.id}`">详情</NuxtLink><button class="xj-button" :disabled="point.checkedToday || locating" @click="submitCheckin(point)">{{ point.checkedToday ? '今日已打卡' : locating ? '正在定位' : '定位打卡' }}</button></div>
        </div>
      </article>
    </div>
    <div v-else class="xj-empty">没有符合条件的点位</div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const route = useRoute()
const cityId = ref(String(route.query.cityId || ''))
const keyword = ref('')
const { data: cityData } = await useFetch<any>('/api/cities')
const cities = computed(() => cityData.value?.data || [])
const points = ref<any[]>([])
const { locating, submitXingjianCheckin } = useXingjianCheckin()
async function refreshPoints() {
  const response = await $fetch<any>('/api/points', { query: { cityId: cityId.value || undefined, keyword: keyword.value || undefined } })
  points.value = response.data
}
async function submitCheckin(point: any) {
  try {
    const response = await submitXingjianCheckin(point.id)
    ElMessage.success(response.message)
    point.checkedToday = true
  } catch (error: any) { ElMessage.error(error?.data?.message || '打卡失败') }
}
await refreshPoints()
watch(cityId, refreshPoints)
</script>
