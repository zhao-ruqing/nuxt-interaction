<template>
  <div class="xj-page">
    <span class="xj-kicker">CURATED ROUTES</span>
    <h1 class="xj-title">城市路线</h1>
    <p class="xj-lead">
      按路线依次完成全部点位，即可领取一次性路线积分和完成徽章。
    </p>
    <div class="xj-grid" style="margin-top: 40px">
      <NuxtLink
        v-for="item in routes"
        :key="item.id"
        :to="`/routes/${item.id}`"
        class="xj-card"
        ><div class="xj-card__meta">
          <span>{{ item.cityName }}</span
          ><span>{{ item.difficulty }}</span>
        </div>
        <h2>{{ item.name }}</h2>
        <p>{{ item.description }}</p>
        <div class="xj-card__footer">
          <span
            >{{ item.pointCount }} 站 · {{ item.estimatedMinutes }} 分钟</span
          ><span class="xj-points">+{{ item.pointsReward }} PTS →</span>
        </div></NuxtLink
      >
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "xingjian" });
const { data } = await useFetch<any>("/api/routes");
const routes = computed(() => data.value?.data || []);
</script>
