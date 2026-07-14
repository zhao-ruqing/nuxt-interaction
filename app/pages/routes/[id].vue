<template>
  <div v-if="routeData" class="xj-page">
    <NuxtLink to="/routes" class="xj-kicker">← BACK TO ROUTES</NuxtLink>
    <div class="route-head">
      <div>
        <h1 class="xj-title">{{ routeData.name }}</h1>
        <p class="xj-lead">{{ routeData.description }}</p>
      </div>
      <div class="xj-panel progress">
        <span>路线进度</span
        ><strong
          >{{ routeData.checkedCount }}/{{ routeData.points.length }}</strong
        ><button
          class="xj-button"
          :disabled="
            routeData.completed ||
            routeData.checkedCount < routeData.points.length
          "
          @click="complete"
        >
          {{
            routeData.completed
              ? "奖励已领取"
              : `领取 ${routeData.pointsReward} 积分`
          }}
        </button>
      </div>
    </div>
    <div class="route-list">
      <NuxtLink
        v-for="point in routeData.points"
        :key="point.id"
        :to="`/checkins/${point.id}`"
        class="route-stop"
        ><span>{{ String(point.sequenceNo).padStart(2, "0") }}</span>
        <div>
          <h2>{{ point.name }}</h2>
          <p>{{ point.address }}</p>
        </div>
        <strong :class="{ done: point.checked }">{{
          point.checked ? "已打卡" : "待探索"
        }}</strong></NuxtLink
      >
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "xingjian" });
const route = useRoute();
const { data, refresh } = await useFetch<any>(`/api/routes/${route.params.id}`);
const routeData = computed(() => data.value?.data);
async function complete() {
  try {
    const response = await $fetch<any>(
      `/api/routes/${route.params.id}/complete`,
      { method: "POST" },
    );
    ElMessage.success(response.message);
    await refresh();
  } catch (error: any) {
    ElMessage.error(error?.data?.message || "领取失败");
  }
}
</script>
<style scoped lang="scss">
.route-head {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr;
  gap: 60px;
  margin: 70px 0;
}
.progress span {
  color: rgba(255, 255, 255, 0.4);
}
.progress strong {
  display: block;
  margin: 16px 0 24px;
  font-size: 48px;
  color: #f4ff58;
}
.route-list {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.route-stop {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  align-items: center;
  padding: 25px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.route-stop > span {
  font: 20px var(--void-mono);
  color: #f4ff58;
}
.route-stop h2 {
  color: #fff;
}
.route-stop p {
  color: rgba(255, 255, 255, 0.38);
}
.route-stop > strong {
  color: rgba(255, 255, 255, 0.3);
}
.route-stop > strong.done {
  color: #9cffaa;
}
</style>
