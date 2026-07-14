<template>
  <div class="xj-page" v-if="point">
    <NuxtLink to="/checkins" class="xj-kicker">← BACK TO POINTS</NuxtLink>
    <div class="detail-grid">
      <section><h1 class="xj-title">{{ point.name }}</h1><p class="xj-lead">{{ point.description }}</p><div class="detail-address">{{ point.cityName }} · {{ point.address }}</div><button class="xj-button" :disabled="point.checkedToday" @click="submitCheckin">{{ point.checkedToday ? '今日已完成打卡' : `打卡并获得 ${point.pointsReward} 积分` }}</button></section>
      <aside class="xj-panel coordinate"><span class="xj-kicker">COORDINATE</span><strong>{{ point.latitude.toFixed(6) }}</strong><strong>{{ point.longitude.toFixed(6) }}</strong><p>建议围栏半径 {{ point.checkinRadius }} 米</p></aside>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const route = useRoute()
const { data, refresh } = await useFetch<any>(`/api/points/${route.params.id}`)
const point = computed(() => data.value?.data)
async function submitCheckin() { try { const response = await $fetch<any>('/api/checkins', { method: 'POST', body: { pointId: point.value.id } }); ElMessage.success(response.message); await refresh() } catch (error: any) { ElMessage.error(error?.data?.message || '打卡失败') } }
</script>
<style scoped lang="scss">.detail-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:70px;align-items:center;min-height:620px}.detail-address{margin:35px 0;color:rgba(255,255,255,.42)}.coordinate{display:flex;flex-direction:column;gap:18px}.coordinate strong{font:30px var(--void-mono);color:#f4ff58}.coordinate p{color:rgba(255,255,255,.4)}</style>
