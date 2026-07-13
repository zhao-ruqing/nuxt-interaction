<template>
  <div class="products-page">
    <!-- 页头 -->
    <section class="page-header">
      <div class="header-inner">
        <h1>饮品商城</h1>
        <p>精选咖啡、汽水、茶饮与果汁，为你带来每一口的惬意时光</p>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="filter-bar">
      <div class="filter-inner">
        <div class="category-tabs">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="tab-btn"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            {{ cat.name }}
          </button>
        </div>
        <div class="search-box">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索饮品..."
            @keyup.enter="fetchProducts"
          />
          <button class="search-btn" @click="fetchProducts">搜索</button>
        </div>
      </div>
    </section>

    <!-- 商品列表 -->
    <section class="product-list">
      <div class="list-inner">
        <div v-if="pending" class="loading">
          <span class="loading-spinner" />
          加载中...
        </div>

        <div v-else-if="!products.length" class="empty">
          <LucideIcon name="leaf" :size="48" class="empty-icon" />
          <p>暂无相关饮品</p>
        </div>

        <div v-else class="grid">
          <NuxtLink
            v-for="item in products"
            :key="item.id"
            :to="`/products/${item.id}`"
            class="product-card"
          >
            <div class="card-image" :class="`bg-${item.category}`">
              <LucideIcon :name="item.image" :size="72" color="#fff" class="product-icon" />
              <div class="tags">
                <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="card-category">{{ item.categoryName }}</div>
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="card-desc">{{ item.description }}</p>
              <div class="card-footer">
                <div class="price">
                  <span class="current">¥{{ item.price }}</span>
                  <span v-if="item.originalPrice" class="original">¥{{ item.originalPrice }}</span>
                </div>
                <div class="meta">
                  <span class="rating"><LucideIcon name="star" :size="14" class="rating-icon" /> {{ item.rating }}</span>
                  <span class="sales">已售 {{ formatSales(item.sales) }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <p v-if="products.length" class="total-hint">共 {{ total }} 款饮品</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Category, Product, ProductListResponse } from '~/types/product'

definePageMeta({ layout: 'default' })

useHead({ title: '饮品商城' })

const activeCategory = ref('all')
const keyword = ref('')
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const pending = ref(true)

function formatSales(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toString()
}

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
}

watch(activeCategory, () => fetchProducts())

const route = useRoute()

onMounted(() => {
  const q = route.query.keyword
  if (typeof q === 'string' && q) keyword.value = q
  fetchProducts()
})
</script>

<style scoped lang="scss">
.products-page {
  padding-top: $navbar-height;
}

.page-header {
  background: linear-gradient(135deg, #eef1ff 0%, #f8f9fb 50%, #fff5ee 100%);
  padding: 60px 24px 48px;
  text-align: center;

  h1 {
    font-size: 40px;
    font-weight: 800;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 16px;
    color: $text-secondary;
  }
}

.header-inner {
  max-width: $max-width;
  margin: 0 auto;
}

.filter-bar {
  position: sticky;
  top: $navbar-height;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border;
  padding: 16px 24px;
}

.filter-inner {
  max-width: $max-width;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  color: $text-secondary;
  background: $bg-gray;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    color: $text;
    background: #fff;
    border-color: $border;
  }

  &.active {
    color: #fff;
    background: $primary;
    border-color: $primary;
  }
}

.search-box {
  display: flex;
  gap: 8px;

  input {
    width: 200px;
    padding: 8px 14px;
    border: 1.5px solid $border;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: $primary;
    }
  }
}

.search-btn {
  padding: 8px 18px;
  background: $primary;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: $primary-dark;
  }
}

.product-list {
  padding: 40px 24px 80px;
}

.list-inner {
  max-width: $max-width;
  margin: 0 auto;
}

.loading,
.empty {
  text-align: center;
  padding: 80px 0;
  color: $text-secondary;
  font-size: 15px;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
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

.empty-icon {
  display: block;
  margin: 0 auto 12px;
  color: $text-muted;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.product-card {
  background: #fff;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow;
  transition: box-shadow 0.3s, transform 0.3s;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }
}

.card-image {
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;

  .product-icon {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }

  &.bg-coffee { background: linear-gradient(135deg, #d4a574 0%, #8b6914 100%); }
  &.bg-soda { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); }
  &.bg-tea { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); }
  &.bg-juice { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); }
  &.bg-milk { background: linear-gradient(135deg, #e8b4d0 0%, #c39bd3 100%); }
}

.tags {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.tag {
  background: rgba(255, 255, 255, 0.9);
  color: $text;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.card-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-category {
  font-size: 12px;
  color: $primary;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.price {
  .current {
    font-size: 20px;
    font-weight: 700;
    color: #e74c3c;
  }

  .original {
    font-size: 13px;
    color: $text-muted;
    text-decoration: line-through;
    margin-left: 6px;
  }
}

.meta {
  text-align: right;
  font-size: 12px;
  color: $text-secondary;

  .rating {
    color: #f39c12;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.total-hint {
  text-align: center;
  margin-top: 40px;
  font-size: 14px;
  color: $text-muted;
}

@media (max-width: $breakpoint-lg) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .page-header h1 {
    font-size: 28px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .filter-inner {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    flex: 1;
    width: auto;
  }
}
</style>
