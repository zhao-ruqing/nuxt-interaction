<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>行鉴</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/products" class="void-nav__link" data-magnetic>商城</NuxtLink>
        <NuxtLink to="/xingjian" class="void-nav__link" data-magnetic>行鉴</NuxtLink>
        <AuthAccountLinks variant="void" />
      </nav>
    </header>

    <main class="void-page pay-page">
      <div v-if="pending" class="pay-state">
        <span class="pay-spinner" />
        加载订单信息...
      </div>

      <div v-else-if="error" class="pay-state">
        <LucideIcon name="frown" :size="48" class="pay-state__icon" />
        <p>{{ error }}</p>
        <NuxtLink to="/products" class="void-btn void-btn--primary pay-state__btn" data-magnetic>
          <span class="void-btn__glow" />
          返回商城
        </NuxtLink>
      </div>

      <template v-else-if="product">
        <nav class="pay-crumb">
          <NuxtLink to="/products">饮品商城</NuxtLink>
          <span class="pay-crumb__sep">/</span>
          <NuxtLink :to="`/products/${product.id}`">{{ product.name }}</NuxtLink>
          <span class="pay-crumb__sep">/</span>
          <span>确认支付</span>
        </nav>

        <div v-if="isAutoOrder" class="pay-banner" ref="bannerRef">
          <LucideIcon name="bot" :size="28" class="pay-banner__icon" />
          <div>
            <strong>AI 助手已为您选好商品</strong>
            <p>请核对订单信息并输入支付密码完成下单</p>
          </div>
        </div>

        <div class="pay-layout" ref="layoutRef">
          <section class="pay-panel">
            <div class="pay-panel__badge">
              <span class="void-card__pulse" />
              ORDER CHECK
            </div>
            <h1 class="pay-panel__title">确认订单</h1>

            <div class="pay-item">
              <div class="pay-item__image" :class="`bg-${product.category}`">
                <LucideIcon :name="product.image" :size="40" color="#fff" />
              </div>
              <div class="pay-item__info">
                <h3>{{ product.name }}</h3>
                <p>{{ selectedSpecLabel }}</p>
                <p>× {{ orderQuantity }}</p>
              </div>
              <div class="pay-item__price">¥{{ unitPrice }}</div>
            </div>

            <div class="pay-summary">
              <div class="pay-summary__row">
                <span>商品小计</span>
                <span>¥{{ totalPrice }}</span>
              </div>
              <div class="pay-summary__row">
                <span>配送费</span>
                <span class="pay-summary__free">免配送费</span>
              </div>
              <div class="pay-summary__row pay-summary__row--total">
                <span>应付金额</span>
                <span class="pay-summary__amount">¥{{ totalPrice }}</span>
              </div>
            </div>

            <p class="pay-stock">当前库存 {{ product.stock }} 件</p>
          </section>

          <section class="pay-panel">
            <h2 class="pay-panel__title pay-panel__title--sm">支付方式</h2>
            <div class="pay-methods">
              <label
                v-for="method in payMethods"
                :key="method.key"
                class="pay-method"
                :class="{ 'pay-method--active': payMethod === method.key }"
              >
                <input v-model="payMethod" type="radio" :value="method.key">
                <LucideIcon :name="method.icon" :size="20" class="pay-method__icon" />
                <span>{{ method.label }}</span>
              </label>
            </div>

            <div class="pay-field">
              <label for="pay-password">支付密码</label>
              <input
                id="pay-password"
                v-model="password"
                type="password"
                maxlength="20"
                placeholder="请输入 6 位以上支付密码"
                data-ghost-target="pay-password"
                @keyup.enter="handlePay"
              >
              <p class="pay-field__hint">演示环境：任意 6 位以上密码即可</p>
            </div>

            <div class="pay-confirm">
              <label class="pay-confirm__check">
                <input v-model="confirmed" type="checkbox" data-ghost-target="pay-confirm">
                <span>我已核对订单信息，确认支付 ¥{{ totalPrice }}</span>
              </label>
            </div>

            <button
              class="void-btn void-btn--primary"
              data-ghost-target="pay-submit"
              data-magnetic
              :disabled="paying || !canPay"
              @click="handlePay"
            >
              <span class="void-btn__glow" />
              {{ paying ? '支付中...' : `确认支付 ¥${totalPrice}` }}
            </button>

            <NuxtLink :to="`/products/${product.id}`" class="pay-cancel">返回修改</NuxtLink>
          </section>
        </div>
      </template>
    </main>
  </VoidShell>
</template>

<script setup lang="ts">
import type { Product, ProductDetailResponse } from '~/types/product'
import { validateOrderQuantity } from '~/composables/useActionExecutor'
import { useOrderAutomationStore } from '~/stores/orderAutomation'
import { gsap } from 'gsap'

definePageMeta({ layout: false })

useHead({
  title: '确认支付 — 行鉴',
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    },
  ],
})

const route = useRoute()
const orderStore = useOrderAutomationStore()

const product = ref<Product | null>(null)
const pending = ref(true)
const error = ref('')
const password = ref('')
const confirmed = ref(false)
const paying = ref(false)
const payMethod = ref('wechat')

const bannerRef = ref<HTMLElement>()
const layoutRef = ref<HTMLElement>()

const productId = computed(() => Number(route.query.productId))
const specIndex = computed(() => Math.max(0, Number(route.query.specIndex) || 0))
const orderQuantity = computed(() => Math.max(1, Number(route.query.quantity) || 1))
const isAutoOrder = computed(() => route.query.from === 'auto')

const payMethods = [
  { key: 'wechat', label: '微信支付', icon: 'message-circle' },
  { key: 'alipay', label: '支付宝', icon: 'wallet' },
  { key: 'balance', label: '余额支付', icon: 'coins' },
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

/** 拉取订单商品信息 */
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

/** 提交支付 */
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

/** 支付页区块入场动画 */
function playEnterAnimation() {
  const targets = [bannerRef.value, layoutRef.value].filter(Boolean)
  if (!targets.length) return
  gsap.fromTo(
    targets,
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out' },
  )
}

onMounted(async () => {
  await fetchProduct()

  if (isAutoOrder.value && product.value && !error.value) {
    ElMessage.info('AI 助手已为您跳转支付页，请确认订单并输入支付密码')
    confirmed.value = true
  }

  nextTick(playEnterAnimation)
})
</script>

<style scoped lang="scss">
.pay-page {
  max-width: 960px;
  margin: 0 auto;
}

.pay-state {
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

.pay-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--void-border);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pay-spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes pay-spin {
  to { transform: rotate(360deg); }
}

.pay-crumb {
  font-family: var(--void-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
  margin-bottom: 28px;

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

.pay-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  margin-bottom: 24px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  backdrop-filter: blur(16px);

  &__icon {
    flex-shrink: 0;
    color: var(--void-text);
    opacity: 0.8;
  }

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
    color: var(--void-text);
  }

  p {
    font-size: 13px;
    color: var(--void-muted);
  }
}

.pay-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.pay-panel {
  padding: 28px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  backdrop-filter: blur(20px);

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 5px 12px;
    border: 1px solid var(--void-border);
    border-radius: 100px;
    font-family: var(--void-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--void-muted);
  }

  &__title {
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 24px;
    color: var(--void-text);

    &--sm {
      font-size: 18px;
    }
  }
}

.pay-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--void-border);
  margin-bottom: 16px;

  &__image {
    width: 68px;
    height: 68px;
    border-radius: var(--void-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid var(--void-border);

    &.bg-coffee { background: linear-gradient(135deg, #5c4033 0%, #2a1810 100%); }
    &.bg-soda { background: linear-gradient(135deg, #8b1a1a 0%, #3d0a0a 100%); }
    &.bg-tea { background: linear-gradient(135deg, #1a5c35 0%, #0a2e18 100%); }
    &.bg-juice { background: linear-gradient(135deg, #8b5a10 0%, #3d2808 100%); }
    &.bg-milk { background: linear-gradient(135deg, #5c3d5c 0%, #2a1a2a 100%); }
  }

  &__info {
    flex: 1;

    h3 {
      font-size: 16px;
      margin-bottom: 4px;
      color: var(--void-text);
    }

    p {
      font-size: 13px;
      color: var(--void-muted);
    }
  }

  &__price {
    font-size: 18px;
    font-weight: 700;
    color: var(--void-text);
  }
}

.pay-summary {
  &__row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 14px;
    color: var(--void-muted);

    &--total {
      border-top: 1px solid var(--void-border);
      margin-top: 8px;
      padding-top: 16px;
      font-size: 15px;
      font-weight: 600;
      color: var(--void-text);
    }
  }

  &__free {
    color: rgba(255, 255, 255, 0.65);
  }

  &__amount {
    font-size: 24px;
    font-weight: 800;
    color: var(--void-text);
  }
}

.pay-stock {
  margin-top: 16px;
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
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
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: border-color 0.25s, background 0.25s;
  color: var(--void-muted);
  font-size: 14px;

  input {
    display: none;
  }

  &--active {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.06);
    color: var(--void-text);
  }

  &__icon {
    display: inline-flex;
    opacity: 0.7;
  }
}

.pay-field {
  margin-bottom: 20px;

  label {
    display: block;
    font-family: var(--void-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--void-muted);
    margin-bottom: 10px;
  }

  input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--void-border);
    border-radius: var(--void-radius-sm);
    font-family: var(--void-display);
    font-size: 15px;
    color: var(--void-text);
    outline: none;
    transition: border-color 0.25s, background 0.25s;

    &::placeholder {
      color: rgba(255, 255, 255, 0.28);
    }

    &:focus {
      border-color: rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.06);
    }
  }

  &__hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--void-muted);
  }
}

.pay-confirm {
  margin-bottom: 24px;

  &__check {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: var(--void-muted);
    cursor: pointer;

    input {
      margin-top: 3px;
      accent-color: #fff;
    }
  }
}

.pay-cancel {
  display: block;
  text-align: center;
  margin-top: 18px;
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--void-muted);
  transition: color 0.25s;

  &:hover {
    color: var(--void-text);
  }
}

@media (max-width: 768px) {
  .pay-layout {
    grid-template-columns: 1fr;
  }
}
</style>
