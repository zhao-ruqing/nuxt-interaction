<template>
  <div class="xj-page">
    <span class="xj-kicker">MY ORDERS</span>
    <h1 class="xj-title">报名与兑换</h1>
    <div class="orders-grid">
      <section class="xj-panel">
        <h2>活动报名</h2>
        <div v-for="item in registrations" :key="item.id" class="order-row">
          <div>
            <strong>{{ item.title }}</strong>
            <p>
              {{ new Date(item.startsAt).toLocaleString("zh-CN") }} ·
              {{ item.venue }}
            </p>
          </div>
          <span>{{ statusText[item.status] }}</span>
        </div>
        <div v-if="!registrations.length" class="xj-empty">暂无活动报名</div>
      </section>
      <section class="xj-panel">
        <h2>积分兑换</h2>
        <div v-for="item in orders" :key="item.id" class="order-row">
          <div>
            <strong>{{ item.productName }} × {{ item.quantity }}</strong>
            <p>{{ item.orderNo }} · {{ item.pointsAmount }} 积分</p>
          </div>
          <span>{{ statusText[item.status] }}</span>
        </div>
        <div v-if="!orders.length" class="xj-empty">暂无兑换订单</div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "xingjian", middleware: "auth" });
const [{ data: registrationData }, { data: orderData }] = await Promise.all([
  useFetch<any>("/api/me/activity-registrations"),
  useFetch<any>("/api/me/exchange-orders"),
]);
const registrations = computed(() => registrationData.value?.data || []);
const orders = computed(() => orderData.value?.data || []);
const statusText: any = {
  pending_payment: "待支付",
  confirmed: "已确认",
  cancelled: "已取消",
  paid: "待发货",
  shipped: "已发货",
  completed: "已完成",
};
</script>
<style scoped lang="scss">
.orders-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 40px;
}
.orders-grid h2 {
  margin-bottom: 20px;
}
.order-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.order-row p {
  margin-top: 7px;
  color: rgba(255, 255, 255, 0.35);
}
.order-row > span {
  color: #f4ff58;
}
</style>
