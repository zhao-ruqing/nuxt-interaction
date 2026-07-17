<template>
  <VoidShell>
    <header class="void-nav void-nav--static">
      <NuxtLink to="/" class="void-nav__logo" data-magnetic>行鉴</NuxtLink>
      <nav class="void-nav__links">
        <NuxtLink to="/" class="void-nav__link" data-magnetic>首页</NuxtLink>
        <NuxtLink to="/xingjian" class="void-nav__link" data-magnetic>行鉴</NuxtLink>
        <AuthAccountLinks variant="void" />
      </nav>
    </header>

    <main class="void-page shop-page">
      <!-- 页头 -->
      <header class="shop-header" ref="headerRef">
        <div class="shop-header__badge">
          <span class="void-card__pulse" />
          MARKET SIGNAL
        </div>
        <h1 class="shop-header__title">饮品商城</h1>
        <p class="shop-header__sub">精选咖啡、汽水、茶饮与果汁，为你带来每一口的惬意时光</p>
      </header>

      <!-- 筛选栏 -->
      <section class="shop-filter" ref="filterRef">
        <div class="shop-filter__tabs">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="shop-tab"
            :class="{ 'shop-tab--active': activeCategory === cat.key }"
            data-magnetic
            @click="activeCategory = cat.key"
          >
            {{ cat.name }}
          </button>
        </div>
        <div class="shop-search">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索饮品..."
            @keyup.enter="fetchProducts"
          >
          <button class="void-btn void-btn--primary shop-search__btn" data-magnetic @click="fetchProducts">
            <span class="void-btn__glow" />
            搜索
          </button>
        </div>
      </section>

      <!-- 商品列表：横向拖拽滑动 -->
      <section class="shop-list" ref="listRef">
        <div v-if="pending" class="shop-state">
          <span class="shop-spinner" />
          加载中...
        </div>

        <div v-else-if="!products.length" class="shop-state">
          <LucideIcon name="leaf" :size="48" class="shop-state__icon" />
          <p>暂无相关饮品</p>
        </div>

        <template v-else>
          <p class="shop-hint">按住拖拽浏览 · 共 {{ total }} 款</p>
          <div
            ref="trackRef"
            class="shop-track"
            :class="{ 'shop-track--dragging': isDragging }"
            @pointerdown="onPointerDown"
            @wheel.prevent
          >
            <div class="shop-track__inner">
              <article
                v-for="item in products"
                :key="item.id"
                class="shop-card"
                role="link"
                tabindex="0"
                :data-product-id="item.id"
                @keydown.enter="openProduct(item.id)"
              >
                <div class="shop-card__image" :class="`bg-${item.category}`">
                  <LucideIcon :name="item.image" :size="56" color="#fff" class="shop-card__icon" />
                  <div class="shop-card__tags">
                    <span v-for="tag in item.tags" :key="tag" class="shop-tag">{{ tag }}</span>
                  </div>
                </div>
                <div class="shop-card__body">
                  <div class="shop-card__category">{{ item.categoryName }}</div>
                  <h3 class="shop-card__title">{{ item.name }}</h3>
                  <p class="shop-card__desc">{{ item.description }}</p>
                  <div class="shop-card__footer">
                    <div class="shop-price">
                      <span class="shop-price__current">¥{{ item.price }}</span>
                      <span v-if="item.originalPrice" class="shop-price__original">¥{{ item.originalPrice }}</span>
                    </div>
                    <div class="shop-meta">
                      <span class="shop-meta__rating">
                        <LucideIcon name="star" :size="14" /> {{ item.rating }}
                      </span>
                      <span>已售 {{ formatSales(item.sales) }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </template>
      </section>
    </main>
  </VoidShell>
</template>

<script setup lang="ts">
import type { Category, Product, ProductListResponse } from '~/types/product'
import { gsap } from 'gsap'

definePageMeta({ layout: false })

useHead({
  title: '饮品商城 — 行鉴',
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    },
  ],
})

const activeCategory = ref('all')
const keyword = ref('')
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const pending = ref(true)

const headerRef = ref<HTMLElement>()
const filterRef = ref<HTMLElement>()
const listRef = ref<HTMLElement>()
const trackRef = ref<HTMLElement>()

const isDragging = ref(false)
/** 指针是否按下（尚未确认是否拖拽） */
let isPointerDown = false
/** 本次手势是否发生过有效拖动 */
let hasDragged = false
let startX = 0
let startScrollLeft = 0
let activePointerId: number | null = null
/** 按下时命中的商品卡片 */
let pressedCard: HTMLElement | null = null

/** 格式化销量展示 */
function formatSales(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toString()
}

/** 进入商品详情 */
function openProduct(id: number | string) {
  navigateTo(`/products/${id}`)
}

/** 开始记录指针位置，拖拽阈值前不进入拖拽态 */
function onPointerDown(e: PointerEvent) {
  const track = trackRef.value
  if (!track || e.button !== 0) return

  activePointerId = e.pointerId
  isPointerDown = true
  isDragging.value = false
  hasDragged = false
  startX = e.clientX
  startScrollLeft = track.scrollLeft
  pressedCard = (e.target as HTMLElement | null)?.closest?.('.shop-card') ?? null

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

/** 超过阈值后进入拖拽并横向滚动 */
function onPointerMove(e: PointerEvent) {
  const track = trackRef.value
  if (!track || !isPointerDown || e.pointerId !== activePointerId) return

  const dx = e.clientX - startX
  if (!hasDragged && Math.abs(dx) > 8) {
    hasDragged = true
    isDragging.value = true
    pressedCard = null
    try { track.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  if (hasDragged) {
    track.scrollLeft = startScrollLeft - dx
  }
}

/** 结束手势：未拖拽则打开商品，已拖拽则忽略点击 */
function onPointerUp(e: PointerEvent) {
  if (activePointerId !== null && e.pointerId !== activePointerId) return

  const track = trackRef.value
  if (track && activePointerId !== null && hasDragged) {
    try { track.releasePointerCapture(activePointerId) } catch { /* ignore */ }
  }

  const shouldOpen = !hasDragged && pressedCard
  const productId = pressedCard?.dataset.productId

  isPointerDown = false
  isDragging.value = false
  activePointerId = null
  pressedCard = null
  hasDragged = false

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)

  if (shouldOpen && productId) openProduct(productId)
}

/** 拉取商品列表 */
async function fetchProducts() {
  pending.value = true
  const params = new URLSearchParams()
  if (activeCategory.value !== 'all') params.set('category', activeCategory.value)
  if (keyword.value.trim()) params.set('keyword', keyword.value.trim())

  const query = params.toString()
  const url = query ? `/api/products?${query}` : '/api/products'

  const res = await $fetch<ProductListResponse>(url)
  if (res.success) {
    products.value = res.data.list
    categories.value = res.data.categories
    total.value = res.data.total
  }
  pending.value = false
  await nextTick()
  if (trackRef.value) trackRef.value.scrollLeft = 0
}

/** 页面区块入场动画 */
function playEnterAnimation() {
  const targets = [headerRef.value, filterRef.value, listRef.value].filter(Boolean)
  gsap.fromTo(
    targets,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
  )
}

/** 锁定页面纵向滚动 */
function lockPageScroll() {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

/** 恢复页面纵向滚动 */
function unlockPageScroll() {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
}

watch(activeCategory, () => fetchProducts())

const route = useRoute()

onMounted(() => {
  lockPageScroll()
  const q = route.query.keyword
  if (typeof q === 'string' && q) keyword.value = q
  fetchProducts()
  nextTick(playEnterAnimation)
})

onUnmounted(() => {
  unlockPageScroll()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<style scoped lang="scss">
.shop-page {
  box-sizing: border-box;
  height: 100dvh;
  max-height: 100dvh;
  max-width: none;
  margin: 0;
  padding: 88px 0 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.shop-header {
  flex-shrink: 0;
  text-align: center;
  margin: 0 auto 20px;
  padding: 0 24px;
  max-width: 1120px;
  width: 100%;

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 5px 12px;
    border: 1px solid var(--void-border);
    border-radius: 100px;
    font-family: var(--void-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--void-muted);
  }

  &__title {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
    color: var(--void-text);
  }

  &__sub {
    font-size: 14px;
    line-height: 1.5;
    color: var(--void-muted);
  }
}

.shop-filter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto 20px;
  padding: 12px 16px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  backdrop-filter: blur(20px);

  &__tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.shop-tab {
  padding: 7px 16px;
  border-radius: 100px;
  font-family: var(--void-display);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--void-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: color 0.25s, background 0.25s, border-color 0.25s;

  &:hover {
    color: var(--void-text);
    background: var(--void-surface-hover);
    border-color: var(--void-border);
  }

  &--active {
    color: #000;
    background: #fff;
    border-color: #fff;
  }
}

.shop-search {
  display: flex;
  gap: 8px;

  input {
    width: 180px;
    padding: 9px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--void-border);
    border-radius: 100px;
    font-family: var(--void-display);
    font-size: 14px;
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

  &__btn {
    width: auto;
    padding: 9px 20px;
    white-space: nowrap;
  }
}

.shop-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--void-muted);
  font-size: 14px;
  letter-spacing: 0.06em;

  &__icon {
    margin-bottom: 12px;
    opacity: 0.5;
  }
}

.shop-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--void-border);
  border-top-color: #fff;
  border-radius: 50%;
  animation: shop-spin 0.6s linear infinite;
  margin-bottom: 10px;
}

@keyframes shop-spin {
  to { transform: rotate(360deg); }
}

.shop-hint {
  flex-shrink: 0;
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto 12px;
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--void-muted);
}

.shop-track {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 0 max(24px, calc((100vw - 1120px) / 2));
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: none;
  touch-action: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &--dragging {
    cursor: grabbing;

    .shop-card {
      pointer-events: none;
    }
  }

  &__inner {
    display: flex;
    align-items: stretch;
    gap: 16px;
    width: max-content;
    height: 100%;
    max-height: 420px;
  }
}

.shop-card {
  display: flex;
  flex-direction: column;
  flex: 0 0 280px;
  width: 280px;
  height: 100%;
  max-height: 420px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  overflow: hidden;
  backdrop-filter: blur(16px);
  transition: border-color 0.3s, background 0.3s;
  cursor: pointer;

  &:hover {
    border-color: var(--void-border-hover);
    background: var(--void-surface-hover);
  }

  &__image {
    position: relative;
    height: 140px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &.bg-coffee { background: linear-gradient(135deg, #5c4033 0%, #2a1810 100%); }
    &.bg-soda { background: linear-gradient(135deg, #8b1a1a 0%, #3d0a0a 100%); }
    &.bg-tea { background: linear-gradient(135deg, #1a5c35 0%, #0a2e18 100%); }
    &.bg-juice { background: linear-gradient(135deg, #8b5a10 0%, #3d2808 100%); }
    &.bg-milk { background: linear-gradient(135deg, #5c3d5c 0%, #2a1a2a 100%); }
  }

  &__icon {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
  }

  &__tags {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    gap: 6px;
  }

  &__body {
    padding: 16px 18px 18px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__category {
    font-family: var(--void-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--void-muted);
    margin-bottom: 6px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--void-text);
  }

  &__desc {
    font-size: 12px;
    color: var(--void-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
    margin-bottom: 12px;
  }

  &__footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.shop-tag {
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.shop-price {
  &__current {
    font-size: 18px;
    font-weight: 700;
    color: var(--void-text);
  }

  &__original {
    font-size: 12px;
    color: var(--void-muted);
    text-decoration: line-through;
    margin-left: 6px;
  }
}

.shop-meta {
  text-align: right;
  font-size: 11px;
  color: var(--void-muted);
  font-family: var(--void-mono);
  letter-spacing: 0.04em;

  &__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.72);
    margin-bottom: 2px;
  }
}

@media (max-width: 600px) {
  .shop-page {
    padding-top: 72px;
  }

  .shop-header__title {
    font-size: 26px;
  }

  .shop-card {
    flex-basis: 250px;
    width: 250px;
  }

  .shop-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .shop-search {
    input {
      flex: 1;
      width: auto;
    }
  }
}
</style>
