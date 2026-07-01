<template>
  <div class="payment-page">
    <div v-if="pending" class="loading">
      <span class="loading-spinner" />
      加载订单信息...
    </div>

    <div v-else-if="error" class="error">
      <span class="error-icon">😕</span>
      <p>{{ error }}</p>
      <NuxtLink to="/products" class="back-btn">返回商城</NuxtLink>
    </div>

    <template v-else-if="product">
      <nav class="breadcrumb">
        <NuxtLink to="/products">饮品商城</NuxtLink>
        <span class="sep">/</span>
        <NuxtLink :to="`/products/${product.id}`">{{ product.name }}</NuxtLink>
        <span class="sep">/</span>
        <span>确认支付</span>
      </nav>

      <div v-if="isAutoOrder" class="auto-banner">
        <span class="banner-icon">🤖</span>
        <div>
          <strong>AI 助手已为您选好商品</strong>
          <p>请核对订单信息并输入支付密码完成下单</p>
        </div>
      </div>

      <div class="payment-layout">
        <section class="order-card">
          <h1>确认订单</h1>

          <div class="order-item">
            <div class="item-image" :class="`bg-${product.category}`">
              <span>{{ product.image }}</span>
            </div>
            <div class="item-info">
              <h3>{{ product.name }}</h3>
              <p class="spec">{{ selectedSpecLabel }}</p>
              <p class="qty">× {{ orderQuantity }}</p>
            </div>
            <div class="item-price">¥{{ unitPrice }}</div>
          </div>

          <div class="summary-row">
            <span>商品小计</span>
            <span>¥{{ totalPrice }}</span>
          </div>
          <div class="summary-row">
            <span>配送费</span>
            <span class="free">免配送费</span>
          </div>
          <div class="summary-row total">
            <span>应付金额</span>
            <span class="amount">¥{{ totalPrice }}</span>
          </div>

          <p class="stock-hint">当前库存 {{ product.stock }} 件</p>
        </section>

        <section class="pay-card">
          <h2>支付方式</h2>
          <div class="pay-methods">
            <label
              v-for="method in payMethods"
              :key="method.key"
              class="pay-method"
              :class="{ active: payMethod === method.key }"
            >
              <input v-model="payMethod" type="radio" :value="method.key" />
              <span class="method-icon">{{ method.icon }}</span>
              <span>{{ method.label }}</span>
            </label>
          </div>

          <div class="password-section">
            <label for="pay-password">支付密码</label>
            <input
              id="pay-password"
              v-model="password"
              type="password"
              maxlength="20"
              placeholder="请输入 6 位以上支付密码"
              data-ghost-target="pay-password"
              @keyup.enter="handlePay"
            />
            <p class="password-hint">演示环境：任意 6 位以上密码即可</p>
          </div>

          <div class="confirm-section">
            <label class="confirm-check">
              <input v-model="confirmed" type="checkbox" data-ghost-target="pay-confirm" />
              <span>我已核对订单信息，确认支付 ¥{{ totalPrice }}</span>
            </label>
          </div>

          <button
            class="pay-btn"
            data-ghost-target="pay-submit"
            :disabled="paying || !canPay"
            @click="handlePay"
          >
            {{ paying ? '支付中...' : `确认支付 ¥${totalPrice}` }}
          </button>

          <NuxtLink :to="`/products/${product.id}`" class="cancel-link">返回修改</NuxtLink>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductDetailResponse } from '~/types/product'
import { validateOrderQuantity } from '~/composables/useActionExecutor'

definePageMeta({ layout: 'default' })

useHead({ title: '确认支付' })

const route = useRoute()
const orderStore = useOrderAutomationStore()

const product = ref<Product | null>(null)
const pending = ref(true)
const error = ref('')
const password = ref('')
const confirmed = ref(false)
const paying = ref(false)
const payMethod = ref('wechat')

const productId = computed(() => Number(route.query.productId))
const specIndex = computed(() => Math.max(0, Number(route.query.specIndex) || 0))
const orderQuantity = computed(() => Math.max(1, Number(route.query.quantity) || 1))
const isAutoOrder = computed(() => route.query.from === 'auto')

const payMethods = [
  { key: 'wechat', label: '微信支付', icon: '💚' },
  { key: 'alipay', label: '支付宝', icon: '💙' },
  { key: 'balance', label: '余额支付', icon: '💰' },
]

const selectedSpecLabel = computed(() => {
  if (!product.value) return ''
  return product.value.specs[specIndex.value]?.size ?? product.value.specs[0]?.size ?? ''
})

const unitPrice = computed(() => {
  if (!product.value) return 0
  return product.value.specs[specIndex.value]?.price ?? product.value.price
})

const totalPrice = computed(() => unitPrice.value * orderQuantity.value)

const canPay = computed(() => confirmed.value && password.value.length >= 6)

async function fetchProduct() {
  pending.value = true
  error.value = ''

  if (!productId.value || Number.isNaN(productId.value)) {
    error.value = '缺少商品信息'
    pending.value = false
    return
  }

  try {
    const res = await $fetch<ProductDetailResponse>(`/api/products/${productId.value}`)
    if (res.success) {
      product.value = res.data
      const qtyCheck = validateOrderQuantity(orderQuantity.value, res.data.stock)
      if (!qtyCheck.valid) {
        error.value = qtyCheck.message!
      }
    }
  }
  catch (e: any) {
    error.value = e?.data?.message || '订单加载失败'
  }
  finally {
    pending.value = false
  }
}

async function handlePay() {
  if (!product.value || paying.value) return

  if (!confirmed.value) {
    ElMessage.warning('请先勾选确认支付')
    return
  }
  if (password.value.length < 6) {
    ElMessage.warning('请输入至少 6 位支付密码')
    return
  }

  const qtyCheck = validateOrderQuantity(orderQuantity.value, product.value.stock)
  if (!qtyCheck.valid) {
    ElMessage.warning(qtyCheck.message!)
    return
  }

  paying.value = true
  try {
    const res = await $fetch<{ success: boolean; message: string }>('/api/orders/checkout', {
      method: 'POST',
      body: {
        productId: product.value.id,
        quantity: orderQuantity.value,
        password: password.value,
      },
    })

    if (res.success) {
      ElMessage.success(res.message || '支付成功！')
      orderStore.clear()
      await navigateTo('/products')
    }
  }
  catch (e: any) {
    ElMessage.error(e?.data?.message || '支付失败，请重试')
  }
  finally {
    paying.value = false
  }
}

onMounted(async () => {
  await fetchProduct()

  if (isAutoOrder.value && product.value && !error.value) {
    ElMessage.info('AI 助手已为您跳转支付页，请确认订单并输入支付密码')
    confirmed.value = true
  }
})
</script>

<style scoped lang="scss">
.payment-page {
  padding: calc($navbar-height + 32px) 24px 80px;
  max-width: $max-width;
  margin: 0 auto;
}

.loading,
.error {
  text-align: center;
  padding: 120px 0;
  color: $text-secondary;
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 2px solid $border;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.back-btn {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 24px;
  background: $primary;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;

  &:hover {
    background: $primary-dark;
  }
}

.breadcrumb {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 24px;

  a:hover {
    color: $primary;
  }

  .sep {
    margin: 0 8px;
  }
}

.auto-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba($primary, 0.08) 0%, rgba($primary, 0.03) 100%);
  border: 1px solid rgba($primary, 0.2);
  border-radius: $radius-lg;
  margin-bottom: 24px;

  .banner-icon {
    font-size: 32px;
  }

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: $text-secondary;
  }
}

.payment-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.order-card,
.pay-card {
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow;
  padding: 28px;
}

.order-card h1,
.pay-card h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid $border;
  margin-bottom: 16px;
}

.item-image {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  flex-shrink: 0;

  &.bg-coffee { background: linear-gradient(135deg, #d4a574, #8b6914); }
  &.bg-soda { background: linear-gradient(135deg, #e74c3c, #c0392b); }
  &.bg-tea { background: linear-gradient(135deg, #27ae60, #1e8449); }
  &.bg-juice { background: linear-gradient(135deg, #f39c12, #e67e22); }
  &.bg-milk { background: linear-gradient(135deg, #e8b4d0, #c39bd3); }
}

.item-info {
  flex: 1;

  h3 {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .spec,
  .qty {
    font-size: 13px;
    color: $text-secondary;
  }
}

.item-price {
  font-size: 18px;
  font-weight: 600;
  color: #e74c3c;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  color: $text-secondary;

  .free {
    color: #27ae60;
  }

  &.total {
    border-top: 1px solid $border;
    margin-top: 8px;
    padding-top: 16px;
    font-size: 16px;
    color: $text;
    font-weight: 600;

    .amount {
      font-size: 24px;
      color: #e74c3c;
    }
  }
}

.stock-hint {
  margin-top: 16px;
  font-size: 13px;
  color: $text-muted;
}

.pay-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.pay-method {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1.5px solid $border;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  input {
    display: none;
  }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.04);
  }

  .method-icon {
    font-size: 20px;
  }
}

.password-section {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid $border;
    border-radius: 8px;
    font-size: 15px;
    outline: none;

    &:focus {
      border-color: $primary;
    }
  }

  .password-hint {
    margin-top: 6px;
    font-size: 12px;
    color: $text-muted;
  }
}

.confirm-section {
  margin-bottom: 24px;
}

.confirm-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: $text-secondary;
  cursor: pointer;

  input {
    margin-top: 3px;
    accent-color: $primary;
  }
}

.pay-btn {
  width: 100%;
  padding: 16px;
  background: $primary;
  color: #fff;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: $primary-dark;
    box-shadow: 0 4px 16px rgba($primary, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.cancel-link {
  display: block;
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: $text-secondary;

  &:hover {
    color: $primary;
  }
}

@media (max-width: $breakpoint-md) {
  .payment-layout {
    grid-template-columns: 1fr;
  }
}
</style>
