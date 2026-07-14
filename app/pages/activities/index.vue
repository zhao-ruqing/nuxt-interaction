<template>
  <div class="xj-page">
    <span class="xj-kicker">OFFLINE PROGRAMS</span><h1 class="xj-title">城市活动</h1><p class="xj-lead">活动报名采用模拟支付，完整保留创建报名、待支付、支付成功和名额扣减状态。</p>
    <div class="xj-grid" style="margin-top:40px">
      <NuxtLink v-for="activity in activities" :key="activity.id" :to="`/activities/${activity.id}`" class="xj-card">
        <div class="xj-card__meta"><span>{{ activity.cityName }}</span><span>{{ formatDate(activity.startsAt) }}</span></div><h2>{{ activity.title }}</h2><p>{{ activity.description }}</p>
        <div class="xj-card__footer"><span>¥ {{ activity.price.toFixed(2) }}</span><span class="xj-points">余 {{ activity.capacity - activity.registeredCount }} 席 →</span></div>
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const { data } = await useFetch<any>('/api/activities')
const activities = computed(() => data.value?.data || [])
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
</script>
