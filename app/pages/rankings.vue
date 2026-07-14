<template>
  <div class="xj-page"><span class="xj-kicker">MYSQL LIVE RANKING</span><h1 class="xj-title">探索排行</h1><p class="xj-lead">榜单直接基于 MySQL 积分账户与打卡记录聚合，后续数据量增长后可切换为快照表。</p>
    <div class="xj-panel" style="margin-top:40px"><table class="xj-table"><thead><tr><th>RANK</th><th>探索者</th><th>累计积分</th><th>当前积分</th><th>打卡数</th></tr></thead><tbody><tr v-for="item in rankings" :key="item.userId"><td class="rank">#{{ String(item.rank).padStart(2,'0') }}</td><td>{{ item.username }}</td><td>{{ item.totalEarned }}</td><td>{{ item.balance }}</td><td>{{ item.checkinCount }}</td></tr></tbody></table></div>
  </div>
</template>
<script setup lang="ts">definePageMeta({ layout: 'xingjian' }); const { data } = await useFetch<any>('/api/rankings'); const rankings = computed(() => data.value?.data || [])</script>
<style scoped>.rank{color:#f4ff58;font-family:var(--void-mono)}</style>
