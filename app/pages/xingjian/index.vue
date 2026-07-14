<template>
  <div class="xj-page">
    <section class="xj-hero">
      <div>
        <span class="xj-kicker">CITY FIELD NOTES / 2026</span>
        <h1 class="xj-title">走进城市，<br>留下你的坐标。</h1>
        <p class="xj-lead">行鉴连接城市点位、文化路线、线下活动与积分奖励。桌面端用于规划、记录和管理每一次探索。</p>
        <div class="xj-toolbar">
          <NuxtLink class="xj-button" to="/checkins">开始探索</NuxtLink>
          <NuxtLink class="xj-button xj-button--ghost" to="/activities">查看活动</NuxtLink>
        </div>
      </div>
      <div class="hero-orbit">
        <div class="hero-orbit__ring" /><div class="hero-orbit__ring hero-orbit__ring--small" />
        <span>31.2304° N</span><strong>行鉴</strong><span>121.4737° E</span>
      </div>
    </section>

    <section class="overview">
      <div><strong>{{ cities.length }}</strong><span>开放城市</span></div>
      <div><strong>{{ pointTotal }}</strong><span>文化点位</span></div>
      <div><strong>{{ routes.length }}</strong><span>探索路线</span></div>
      <div><strong>{{ activities.length }}</strong><span>近期活动</span></div>
    </section>

    <section class="xj-section">
      <span class="xj-kicker">SELECTED CITIES</span>
      <div class="xj-grid">
        <NuxtLink v-for="city in cities" :key="city.id" :to="`/checkins?cityId=${city.id}`" class="xj-card">
          <div class="xj-card__meta"><span>{{ city.province }}</span><span>0{{ city.id }}</span></div>
          <h2>{{ city.name }}</h2><p>{{ city.description }}</p>
          <div class="xj-card__footer"><span>{{ city.pointCount }} 个点位</span><span class="xj-points">EXPLORE →</span></div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const { data: cityResponse } = await useFetch<any>('/api/cities')
const { data: routeResponse } = await useFetch<any>('/api/routes')
const { data: activityResponse } = await useFetch<any>('/api/activities')
const cities = computed(() => cityResponse.value?.data || [])
const routes = computed(() => routeResponse.value?.data || [])
const activities = computed(() => activityResponse.value?.data || [])
const pointTotal = computed(() => cities.value.reduce((sum: number, city: any) => sum + city.pointCount, 0))
</script>

<style scoped lang="scss">
.xj-hero { min-height: 560px; display: grid; grid-template-columns: 1.2fr .8fr; align-items: center; border-bottom: 1px solid rgba(255,255,255,.08); }
.hero-orbit { width: 390px; height: 390px; justify-self: end; border: 1px solid rgba(255,255,255,.12); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; position: relative; font: 11px var(--void-mono); color: rgba(255,255,255,.35); }
.hero-orbit strong { font-size: 74px; color: #f4ff58; }.hero-orbit__ring { position: absolute; inset: 35px; border: 1px dashed rgba(244,255,88,.3); border-radius: 50%; }.hero-orbit__ring--small { inset: 90px; }
.overview { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid rgba(255,255,255,.08); }.overview div { padding: 34px; border-right: 1px solid rgba(255,255,255,.08); }.overview strong { display:block;font-size:38px;color:#f4ff58 }.overview span { color:rgba(255,255,255,.38);font-size:12px }.xj-section { padding-top: 70px; }.xj-section .xj-grid { margin-top: 24px; }
</style>
