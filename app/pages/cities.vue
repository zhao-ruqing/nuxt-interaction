<template>
  <div class="xj-page">
    <span class="xj-kicker">CITY DIRECTORY</span><h1 class="xj-title">开放城市</h1>
    <p class="xj-lead">选择城市，查看当前可探索的文化点位和路线。</p>
    <div class="xj-grid" style="margin-top:40px">
      <NuxtLink v-for="city in cities" :key="city.id" :to="`/checkins?cityId=${city.id}`" class="xj-card">
        <div class="xj-card__meta"><span>{{ city.code.toUpperCase() }}</span><span>{{ city.province }}</span></div>
        <h2>{{ city.name }}</h2><p>{{ city.description }}</p>
        <div class="xj-card__footer"><span>{{ city.pointCount }} 个点位</span><span class="xj-points">进入城市 →</span></div>
      </NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const { data } = await useFetch<any>('/api/cities')
const cities = computed(() => data.value?.data || [])
</script>
