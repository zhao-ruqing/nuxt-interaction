<template>
  <div class="xj-page"><span class="xj-kicker">MYSQL LIVE RANKING</span><h1 class="xj-title">探索排行</h1><p class="xj-lead">榜单直接基于 MySQL 积分账户、打卡和团队成员聚合，后续数据量增长后可切换为快照表。</p>
    <div class="xj-toolbar"><button class="xj-button" :class="{'xj-button--ghost':tab!=='user'}" @click="tab='user'">个人榜</button><button class="xj-button" :class="{'xj-button--ghost':tab!=='team'}" @click="tab='team'">团队榜</button></div>
    <div v-if="tab==='user'" class="xj-panel"><table class="xj-table"><thead><tr><th>RANK</th><th>探索者</th><th>累计积分</th><th>当前积分</th><th>打卡数</th></tr></thead><tbody><tr v-for="item in rankings" :key="item.userId"><td class="rank">#{{ String(item.rank).padStart(2,'0') }}</td><td>{{ item.username }}</td><td>{{ item.totalEarned }}</td><td>{{ item.balance }}</td><td>{{ item.checkinCount }}</td></tr></tbody></table></div>
    <div v-else class="xj-panel"><table class="xj-table"><thead><tr><th>RANK</th><th>团队</th><th>邀请码</th><th>成员</th><th>累计积分</th></tr></thead><tbody><tr v-for="item in teams" :key="item.id"><td class="rank">#{{ String(item.rank).padStart(2,'0') }}</td><td>{{ item.name }}</td><td>{{ item.code }}</td><td>{{ item.memberCount }}</td><td>{{ item.totalPoints }}</td></tr></tbody></table></div>
  </div>
</template>
<script setup lang="ts">definePageMeta({ layout: 'xingjian' });const tab=ref('user');const[{data},{data:teamData}]=await Promise.all([useFetch<any>('/api/rankings'),useFetch<any>('/api/rankings/teams')]);const rankings=computed(()=>data.value?.data||[]);const teams=computed(()=>teamData.value?.data||[])</script>
<style scoped>.rank{color:#f4ff58;font-family:var(--void-mono)}</style>
