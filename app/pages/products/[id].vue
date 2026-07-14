<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>VOID</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/products" class="void-nav__link" data-magnetic>商城</NuxtLink>
        <NuxtLink to="/auth/login" class="void-nav__cta" data-magnetic>登录</NuxtLink>
      </nav>
    </header>

    <main class="void-page detail-page">
      <div v-if="pending" class="detail-state">
        <span class="detail-spinner" />
        加载中...
      </div>

      <div v-else-if="error" class="detail-state">
        <LucideIcon name="frown" :size="48" class="detail-state__icon" />
        <p>{{ error }}</p>
        <NuxtLink to="/products" class="void-btn void-btn--primary detail-state__btn" data-magnetic>
          <span class="void-btn__glow" />
          返回商城
        </NuxtLink>
      </div>

      <template v-else-if="product">
        <nav class="detail-crumb">
          <NuxtLink to="/products">饮品商城</NuxtLink>
          <span class="detail-crumb__sep">/</span>
          <span>{{ product.name }}</span>
        </nav>

        <div class="detail-main" ref="mainRef">
          <div class="detail-image" :class="`bg-${product.category}`">
            <LucideIcon :name="product.image" :size="140" color="#fff" class="detail-image__icon" />
          </div>

          <div class="detail-info">
            <div class="detail-info__tags">
              <span class="detail-chip detail-chip--accent">{{ product.categoryName }}</span>
              <span v-for="tag in product.tags" :key="tag" class="detail-chip">{{ tag }}</span>
            </div>

            <h1 class="detail-info__title">{{ product.name }}</h1>

            <div class="detail-info__meta">
              <span class="detail-info__rating">
                <LucideIcon name="star" :size="16" /> {{ product.rating }}
              </span>
              <span>月销 {{ formatSales(product.sales) }}</span>
              <span>库存 {{ product.stock }}</span>
            </div>

            <p class="detail-info__desc">{{ product.description }}</p>

            <div class="detail-spec">
              <div class="detail-label">选择规格</div>
              <div class="detail-spec__list">
                <button
                  v-for="(spec, i) in product.specs"
                  :key="spec.size"
                  class="detail-spec__btn"
                  :class="{ 'detail-spec__btn--active': selectedSpec === i }"
                  :data-ghost-target="`spec-${i}`"
                  data-magnetic
                  @click="selectedSpec = i"
                >
                  <span class="detail-spec__size">{{ spec.size }}</span>
                  <span class="detail-spec__price">¥{{ spec.price }}</span>
                </button>
              </div>
            </div>

            <div class="detail-qty">
              <div class="detail-label">数量</div>
              <div class="detail-qty__control">
                <button data-ghost-target="quantity-minus" :disabled="quantity <= 1" @click="quantity--">−</button>
                <span data-ghost-target="quantity-value">{{ quantity }}</span>
                <button data-ghost-target="quantity-plus" :disabled="quantity >= product.stock" @click="quantity++">+</button>
              </div>
            </div>

            <div class="detail-actions">
              <div class="detail-total">
                <span class="detail-total__label">合计</span>
                <span class="detail-total__price">¥{{ currentPrice * quantity }}</span>
              </div>
              <button
                class="void-btn void-btn--ghost detail-actions__cart"
                data-ghost-target="add-cart"
                data-magnetic
                @click="addToCart"
              >
                加入购物车
              </button>
              <button
                class="void-btn void-btn--primary detail-actions__buy"
                data-ghost-target="buy-now"
                data-magnetic
                @click="buyNow"
              >
                <span class="void-btn__glow" />
                立即购买
              </button>
            </div>
          </div>
        </div>

        <div v-if="product.ingredients?.length" class="detail-ingredients" ref="ingredientsRef">
          <h2>配料表</h2>
          <div class="detail-ingredients__list">
            <span v-for="item in product.ingredients" :key="item" class="detail-ingredients__item">{{ item }}</span>
          </div>
        </div>
      </template>
    </main>
  </VoidShell>
</template>

<script setup lang="ts">
import type { Product, ProductDetailResponse } from '~/types/product'
import { findSpecMatch, validateOrderQuantity } from '~/composables/useActionExecutor'
import { useOrderAutomationStore } from '~/stores/orderAutomation'
import { gsap } from 'gsap'

definePageMeta({ layout: false })

const route = useRoute()
const orderStore = useOrderAutomationStore()
const ghostHand = useGhostHand()

const product = ref<Product | null>(null)
const pending = ref(true)
const error = ref('')
const selectedSpec = ref(0)
const quantity = ref(1)
const autoOrderRunning = ref(false)

const mainRef = ref<HTMLElement>()
const ingredientsRef = ref<HTMLElement>()

const currentPrice = computed(() => {
  if (!product.value) return 0
  return product.value.specs[selectedSpec.value]?.price ?? product.value.price
})

useHead({
  title: computed(() => product.value ? `${product.value.name} — VOID` : '商品详情 — VOID'),
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    },
  ],
})

/** 格式化销量展示 */
function formatSales(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toString()
}

/** 模拟加入购物车 */
function addToCart() {
  ElMessage.success(`已将 ${quantity.value} 杯「${product.value?.name}」加入购物车（模拟）`)
}

/** 跳转支付页立即购买 */
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

/** 拉取商品详情 */
async function fetchProduct() {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<ProductDetailResponse>(`/api/products/${route.params.id}`)
    if (res.success) {
      product.value = res.data
      nextTick(playEnterAnimation)
    }
  }
  catch (e: any) {
    error.value = e?.data?.message || '商品加载失败'
  }
  finally {
    pending.value = false
  }
}

/** 详情区块入场动画 */
function playEnterAnimation() {
  const targets = [mainRef.value, ingredientsRef.value].filter(Boolean)
  if (!targets.length) return
  gsap.fromTo(
    targets,
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' },
  )
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
.detail-page {
  max-width: 1120px;
  margin: 0 auto;
}

.detail-state {
  text-align: center;
  padding: 120px 0;
  color: var(--void-muted);
  font-size: 14px;
  letter-spacing: 0.06em;

  &__icon {
    display: block;
    margin: 0 auto 12px;
    opacity: 0.5;
  }

  &__btn {
    width: auto;
    margin: 20px auto 0;
    padding: 12px 28px;
  }
}

.detail-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--void-border);
  border-top-color: #fff;
  border-radius: 50%;
  animation: detail-spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes detail-spin {
  to { transform: rotate(360deg); }
}

.detail-crumb {
  font-family: var(--void-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
  margin-bottom: 36px;

  a {
    color: var(--void-muted);
    transition: color 0.25s;

    &:hover {
      color: var(--void-text);
    }
  }

  &__sep {
    margin: 0 10px;
    opacity: 0.4;
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
  border-radius: var(--void-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--void-border);

  &__icon {
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
  }

  &.bg-coffee { background: linear-gradient(135deg, #5c4033 0%, #2a1810 100%); }
  &.bg-soda { background: linear-gradient(135deg, #8b1a1a 0%, #3d0a0a 100%); }
  &.bg-tea { background: linear-gradient(135deg, #1a5c35 0%, #0a2e18 100%); }
  &.bg-juice { background: linear-gradient(135deg, #8b5a10 0%, #3d2808 100%); }
  &.bg-milk { background: linear-gradient(135deg, #5c3d5c 0%, #2a1a2a 100%); }
}

.detail-info {
  &__tags {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 14px;
    color: var(--void-text);
  }

  &__meta {
    display: flex;
    gap: 20px;
    font-family: var(--void-mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    color: var(--void-muted);
    margin-bottom: 20px;
  }

  &__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.78);
  }

  &__desc {
    font-size: 15px;
    color: var(--void-muted);
    line-height: 1.7;
    margin-bottom: 28px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--void-border);
  }
}

.detail-chip {
  background: var(--void-surface);
  color: var(--void-muted);
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid var(--void-border);

  &--accent {
    color: var(--void-text);
    border-color: var(--void-border-hover);
  }
}

.detail-label {
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--void-muted);
  margin-bottom: 12px;
}

.detail-spec {
  margin-bottom: 24px;

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 22px;
    border: 1px solid var(--void-border);
    border-radius: var(--void-radius-sm);
    background: var(--void-surface);
    transition: border-color 0.25s, background 0.25s;
    font-family: var(--void-display);

    &:hover {
      border-color: var(--void-border-hover);
      background: var(--void-surface-hover);
    }

    &--active {
      border-color: rgba(255, 255, 255, 0.45);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &__size {
    font-size: 13px;
    color: var(--void-text);
    margin-bottom: 4px;
  }

  &__price {
    font-size: 15px;
    font-weight: 700;
    color: var(--void-text);
  }
}

.detail-qty {
  margin-bottom: 32px;

  &__control {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--void-border);
    border-radius: 100px;
    overflow: hidden;
    background: var(--void-surface);

    button {
      width: 42px;
      height: 42px;
      font-size: 18px;
      color: var(--void-text);
      background: transparent;
      transition: background 0.2s;

      &:hover:not(:disabled) {
        background: var(--void-surface-hover);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    span {
      width: 48px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--void-text);
      font-family: var(--void-mono);
    }
  }
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  &__cart,
  &__buy {
    width: auto;
    padding: 14px 28px;
  }
}

.detail-total {
  margin-right: 8px;

  &__label {
    font-size: 13px;
    color: var(--void-muted);
    margin-right: 8px;
  }

  &__price {
    font-size: 28px;
    font-weight: 800;
    color: var(--void-text);
  }
}

.detail-ingredients {
  margin-top: 48px;
  padding: 28px 32px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  backdrop-filter: blur(16px);

  h2 {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 16px;
    color: var(--void-muted);
    font-family: var(--void-mono);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__item {
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 13px;
    color: var(--void-muted);
    border: 1px solid var(--void-border);
    background: rgba(255, 255, 255, 0.02);
  }
}

@media (max-width: 768px) {
  .detail-main {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .detail-image {
    height: 260px;

    &__icon {
      transform: scale(0.85);
    }
  }

  .detail-info__title {
    font-size: 26px;
  }

  .detail-actions {
    flex-direction: column;
    align-items: stretch;

    &__cart,
    &__buy {
      width: 100%;
      text-align: center;
    }
  }
}
</style>
