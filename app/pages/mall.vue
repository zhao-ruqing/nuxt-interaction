<template>
  <div class="xj-page"><span class="xj-kicker">POINTS EXCHANGE</span><h1 class="xj-title">积分商城</h1><p class="xj-lead">积分兑换通过 MySQL 事务锁定账户和商品库存，避免余额透支及并发超兑。</p>
    <div class="xj-grid" style="margin-top:40px"><article v-for="product in products" :key="product.id" class="xj-card"><div class="xj-card__meta"><span>{{ product.productType === 'physical' ? '实物' : '虚拟' }}</span><span>库存 {{ product.stock }}</span></div><h2>{{ product.name }}</h2><p>{{ product.description }}</p><div class="xj-card__footer"><span class="xj-points">{{ product.pointsPrice }} PTS</span><button class="xj-button" :disabled="product.stock <= 0" @click="openExchange(product)">兑换</button></div></article></div>
    <el-dialog v-model="dialogVisible" title="确认积分兑换" width="560px"><div class="xj-form" v-if="selected"><p>{{ selected.name }} · {{ selected.pointsPrice }} 积分</p><template v-if="selected.productType === 'physical'"><label>收货人<input v-model="receiver.name"></label><label>联系电话<input v-model="receiver.phone"></label><label>收货地址<textarea v-model="receiver.address" rows="3" /></label></template></div><template #footer><button class="xj-button xj-button--ghost" @click="dialogVisible=false">取消</button> <button class="xj-button" @click="exchange">确认兑换</button></template></el-dialog>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'xingjian' })
const { data, refresh } = await useFetch<any>('/api/mall/products')
const products = computed(() => data.value?.data || [])
const dialogVisible = ref(false); const selected = ref<any>(null); const receiver = reactive({ name: '', phone: '', address: '' })
function openExchange(product:any){selected.value=product;dialogVisible.value=true}
async function exchange(){try{const response=await $fetch<any>('/api/mall/orders',{method:'POST',body:{productId:selected.value.id,quantity:1,receiverName:receiver.name,receiverPhone:receiver.phone,receiverAddress:receiver.address}});ElMessage.success(`${response.message}，剩余 ${response.data.balance} 积分`);dialogVisible.value=false;await refresh()}catch(error:any){ElMessage.error(error?.data?.message||'兑换失败')}}
</script>
