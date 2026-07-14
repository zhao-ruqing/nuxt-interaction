<template>
  <div v-if="activity" class="xj-page">
    <NuxtLink to="/activities" class="xj-kicker">← BACK TO ACTIVITIES</NuxtLink>
    <div class="activity-layout">
      <section><h1 class="xj-title">{{ activity.title }}</h1><p class="xj-lead">{{ activity.description }}</p><div class="facts"><span>{{ activity.cityName }}</span><span>{{ activity.venue }}</span><span>{{ formatDate(activity.startsAt) }}</span><span>报名奖励 +{{ activity.pointsReward }} PTS</span></div></section>
      <aside class="xj-panel">
        <template v-if="!payment"><span class="xj-kicker">REGISTRATION</span><div class="price">¥ {{ activity.price.toFixed(2) }}</div><div class="xj-form"><label>联系人<input v-model="form.contactName" placeholder="请输入姓名"></label><label>联系电话<input v-model="form.contactPhone" placeholder="请输入手机号"></label><button class="xj-button" @click="register">创建报名单</button></div></template>
        <template v-else><span class="xj-kicker">MOCK PAYMENT</span><div class="mock-code">{{ payment.mockCode }}</div><p class="payment-tip">这是模拟支付码，不会产生真实扣款。</p><button class="xj-button" @click="confirmPayment">确认模拟支付 ¥{{ Number(payment.amount).toFixed(2) }}</button></template>
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const route = useRoute()
const { data } = await useFetch<any>(`/api/activities/${route.params.id}`)
const activity = computed(() => data.value?.data)
const form = reactive({ contactName: '', contactPhone: '' })
const payment = ref<any>(null)
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN')
async function register() { try { const response = await $fetch<any>(`/api/activities/${route.params.id}/register`, { method: 'POST', body: form }); payment.value = response.data.payment; ElMessage.success(response.message) } catch (error: any) { ElMessage.error(error?.data?.message || '报名失败') } }
async function confirmPayment() { try { const response = await $fetch<any>(`/api/payments/mock/${payment.value.id}/confirm`, { method: 'POST' }); ElMessage.success(response.message); payment.value = null } catch (error: any) { ElMessage.error(error?.data?.message || '模拟支付失败') } }
</script>
<style scoped lang="scss">.activity-layout{display:grid;grid-template-columns:1.3fr .7fr;gap:70px;align-items:start;padding-top:70px}.facts{display:grid;gap:14px;margin-top:35px;color:rgba(255,255,255,.46)}.price{font-size:48px;font-weight:800;margin:24px 0;color:#f4ff58}.mock-code{margin:25px 0;padding:30px;text-align:center;border:1px dashed #f4ff58;font:20px var(--void-mono);letter-spacing:.12em}.payment-tip{color:rgba(255,255,255,.45);margin-bottom:22px}</style>
