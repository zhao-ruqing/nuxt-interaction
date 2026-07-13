<template>
  <div class="product-detail">
    <div v-if="pending" class="loading">
      <span class="loading-spinner" />
      加载中...
    </div>

    <div v-else-if="error" class="error">
      <LucideIcon name="frown" :size="48" class="error-icon" />
      <p>{{ error }}</p>
      <NuxtLink to="/products" class="back-btn">返回商城</NuxtLink>
    </div>

    <template v-else-if="product">
      <!-- 面包屑 -->
      <nav class="breadcrumb">
        <NuxtLink to="/products">饮品商城</NuxtLink>
        <span class="sep">/</span>
        <span>{{ product.name }}</span>
      </nav>

      <div class="detail-main">
        <!-- 左侧图片 -->
        <div class="detail-image" :class="`bg-${product.category}`">
          <LucideIcon :name="product.image" :size="140" color="#fff" class="product-icon" />
        </div>

        <!-- 右侧信息 -->
        <div class="detail-info">
          <div class="info-tags">
            <span class="category-tag">{{ product.categoryName }}</span>
            <span v-for="tag in product.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <h1>{{ product.name }}</h1>

          <div class="rating-row">
            <span class="rating"><LucideIcon name="star" :size="16" class="rating-icon" /> {{ product.rating }}</span>
            <span class="sales">月销 {{ formatSales(product.sales) }}</span>
            <span class="stock">库存 {{ product.stock }}</span>
          </div>

          <p class="description">{{ product.description }}</p>

          <!-- 规格选择 -->
          <div class="spec-section">
            <div class="spec-label">选择规格</div>
            <div class="spec-list">
              <button
                v-for="(spec, i) in product.specs"
                :key="spec.size"
                class="spec-btn"
                :class="{ active: selectedSpec === i }"
                :data-ghost-target="`spec-${i}`"
                @click="selectedSpec = i"
              >
                <span class="spec-size">{{ spec.size }}</span>
                <span class="spec-price">¥{{ spec.price }}</span>
              </button>
            </div>
          </div>

          <!-- 数量 -->
          <div class="quantity-section">
            <div class="spec-label">数量</div>
            <div class="quantity-control">
              <button data-ghost-target="quantity-minus" :disabled="quantity <= 1" @click="quantity--">−</button>
              <span data-ghost-target="quantity-value">{{ quantity }}</span>
              <button data-ghost-target="quantity-plus" :disabled="quantity >= product.stock" @click="quantity++">+</button>
            </div>
          </div>

          <!-- 价格与操作 -->
          <div class="action-row">
            <div class="total-price">
              <span class="label">合计</span>
              <span class="price">¥{{ currentPrice * quantity }}</span>
            </div>
            <button class="add-cart-btn" data-ghost-target="add-cart" @click="addToCart">加入购物车</button>
            <button class="buy-btn" data-ghost-target="buy-now" @click="buyNow">立即购买</button>
          </div>
        </div>
      </div>

      <!-- 配料表 -->
      <div v-if="product.ingredients?.length" class="ingredients-section">
        <h2>配料表</h2>
        <div class="ingredient-list">
          <span v-for="item in product.ingredients" :key="item" class="ingredient">{{ item }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductDetailResponse } from '~/types/product'
import { findSpecMatch, validateOrderQuantity } from '~/composables/useActionExecutor'
import { useOrderAutomationStore } from '~/stores/orderAutomation'

definePageMeta({ layout: 'default' })

const route = useRoute()
const orderStore = useOrderAutomationStore()
const ghostHand = useGhostHand()

const product = ref<Product | null>(null)
const pending = ref(true)
const error = ref('')
const selectedSpec = ref(0)
const quantity = ref(1)
const autoOrderRunning = ref(false)

const currentPrice = computed(() => {
  if (!product.value) return 0
  return product.value.specs[selectedSpec.value]?.price ?? product.value.price
})

useHead({
  title: computed(() => product.value ? product.value.name : '商品详情'),
})

function formatSales(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toString()
}

function addToCart() {
  ElMessage.success(`已将 ${quantity.value} 杯「${product.value?.name}」加入购物车（模拟）`)
}

function buyNow() {
  if (!product.value) return

  const qtyCheck = validateOrderQuantity(quantity.value, product.value.stock)
  if (!qtyCheck.valid) {
    ElMessage.warning(qtyCheck.message!)
    return
  }

  navigateTo({
    path: '/payment',
    query: {
      productId: product.value.id,
      specIndex: selectedSpec.value,
      quantity: quantity.value,
      from: orderStore.pending?.status === 'running' ? 'auto' : undefined,
    },
  })
}

async function fetchProduct() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<ProductDetailResponse>(`/api/products/${route.params.id}`)
    if (res.success) {
      product.value = res.data
    }
  }
  catch (e: any) {
    error.value = e?.data?.message || '商品加载失败'
  }
  finally {
    pending.value = false
  }
}

/** AI 自动下单：幽灵手依次点击规格、数量、立即购买 */
async function runAutoOrder() {
  const order = orderStore.pending
  if (!order || order.status !== 'pending') return
  if (order.productId !== Number(route.params.id)) return
  if (!product.value || autoOrderRunning.value) return

  autoOrderRunning.value = true
  orderStore.updateStatus('running')

  await nextTick()
  await new Promise(r => setTimeout(r, 600))

  try {
    const specResult = findSpecMatch(order.specs, product.value.specs)
    if (!specResult.matched) {
      const available = product.value.specs.map(s => s.size).join('、')
      const msg = `规格「${order.specs}」与商品不符，可选：${available}`
      ElMessage.warning(msg)
      orderStore.updateStatus('failed', msg)
      return
    }

    const qtyCheck = validateOrderQuantity(order.quantity, product.value.stock)
    if (!qtyCheck.valid) {
      ElMessage.warning(qtyCheck.message!)
      orderStore.updateStatus('failed', qtyCheck.message!)
      return
    }

    const specIndex = specResult.index
    const targetQty = order.quantity
    selectedSpec.value = specIndex
    quantity.value = 1

    await nextTick()
    await new Promise(r => setTimeout(r, 300))

    const specBtn = document.querySelector(`[data-ghost-target="spec-${specIndex}"]`) as HTMLElement
    if (specBtn) await ghostHand.tap(specBtn)

    if (targetQty > 1) {
      const plusBtn = document.querySelector('[data-ghost-target="quantity-plus"]') as HTMLElement
      for (let i = 1; i < targetQty; i++) {
        if (plusBtn && !plusBtn.hasAttribute('disabled')) {
          await ghostHand.tap(plusBtn)
        }
        else {
          quantity.value++
        }
      }
    }

    await new Promise(r => setTimeout(r, 300))

    const buyBtn = document.querySelector('[data-ghost-target="buy-now"]') as HTMLElement
    if (buyBtn) {
      await ghostHand.tap(buyBtn)
      orderStore.updateStatus('done', `${product.value.name} × ${targetQty}，请在支付页确认`)
    }
  }
  catch (e: any) {
    orderStore.updateStatus('failed', e?.message || '自动下单失败')
    ElMessage.error('自动下单失败，请手动操作')
  }
  finally {
    ghostHand.hide()
    autoOrderRunning.value = false
    setTimeout(() => orderStore.clear(), 8000)
  }
}

watch(
  () => [product.value, orderStore.pending] as const,
  ([p, order]) => {
    if (p && order?.status === 'pending' && order.productId === Number(route.params.id)) {
      runAutoOrder()
    }
  },
)

onMounted(() => fetchProduct())
</script>

<style scoped lang="scss">
.product-detail {
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
  display: block;
  margin: 0 auto 12px;
  color: $text-secondary;
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
  margin-bottom: 32px;

  a:hover {
    color: $primary;
  }

  .sep {
    margin: 0 8px;
  }
}

.detail-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

.detail-image {
  height: 400px;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;

  .product-icon {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  }

  &.bg-coffee { background: linear-gradient(135deg, #d4a574 0%, #8b6914 100%); }
  &.bg-soda { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); }
  &.bg-tea { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); }
  &.bg-juice { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); }
  &.bg-milk { background: linear-gradient(135deg, #e8b4d0 0%, #c39bd3 100%); }
}

.info-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.category-tag {
  background: rgba($primary, 0.1);
  color: $primary;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.tag {
  background: $bg-gray;
  color: $text-secondary;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.detail-info h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.rating-row {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 20px;

  .rating {
    color: #f39c12;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.description {
  font-size: 15px;
  color: $text-secondary;
  line-height: 1.7;
  margin-bottom: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid $border;
}

.spec-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.spec-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border: 1.5px solid $border;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;

  &:hover {
    border-color: $primary-light;
  }

  &.active {
    border-color: $primary;
    background: rgba($primary, 0.05);
  }

  .spec-size {
    font-size: 13px;
    color: $text;
    margin-bottom: 4px;
  }

  .spec-price {
    font-size: 15px;
    font-weight: 600;
    color: #e74c3c;
  }
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid $border;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 32px;

  button {
    width: 40px;
    height: 40px;
    font-size: 18px;
    color: $text;
    background: $bg-gray;
    cursor: pointer;
    transition: background 0.2s;

    &:hover:not(:disabled) {
      background: $border;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  span {
    width: 48px;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
  }
}

.action-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.total-price {
  .label {
    font-size: 14px;
    color: $text-secondary;
    margin-right: 8px;
  }

  .price {
    font-size: 28px;
    font-weight: 700;
    color: #e74c3c;
  }
}

.add-cart-btn,
.buy-btn {
  padding: 14px 32px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-cart-btn {
  background: #fff;
  color: $primary;
  border: 1.5px solid $primary;

  &:hover {
    background: rgba($primary, 0.05);
  }
}

.buy-btn {
  background: $primary;
  color: #fff;
  border: 1.5px solid $primary;

  &:hover {
    background: $primary-dark;
    box-shadow: 0 4px 16px rgba($primary, 0.35);
  }
}

.ingredients-section {
  margin-top: 48px;
  padding: 32px;
  background: $bg-gray;
  border-radius: $radius-lg;

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  }
}

.ingredient-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ingredient {
  background: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: $text-secondary;
  box-shadow: $shadow;
}

@media (max-width: $breakpoint-md) {
  .detail-main {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .detail-image {
    height: 280px;

    .product-icon {
      transform: scale(0.85);
    }
  }

  .detail-info h1 {
    font-size: 24px;
  }

  .action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .add-cart-btn,
  .buy-btn {
    text-align: center;
  }
}
</style>
