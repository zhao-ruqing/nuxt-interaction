<template>
  <div class="manage-products">
    <!-- 顶部：标题 + 操作栏 -->
    <div class="page-header">
      <div>
        <h2>商品管理</h2>
        <p class="page-desc">管理饮品商城的商品信息、规格与库存</p>
      </div>
      <el-button type="primary" size="large" @click="openCreate">
        <el-icon style="margin-right:4px"><Plus /></el-icon>新增商品
      </el-button>
    </div>

    <!-- 筛选卡片 -->
    <div class="filter-card">
      <div class="filter-left">
        <el-select v-model="filterCategory" placeholder="全部分类" clearable style="width: 150px" @change="fetchProducts">
          <el-option v-for="cat in categoryOptions" :key="cat.key" :label="cat.name" :value="cat.key" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="搜索商品名称、描述、标签"
          clearable
          :prefix-icon="Search"
          style="width: 300px"
          @keyup.enter="fetchProducts"
          @clear="fetchProducts"
        />
        <el-button type="primary" :loading="loading" @click="fetchProducts">查询</el-button>
      </div>
      <span class="filter-total">共 <b>{{ total }}</b> 件商品</span>
    </div>

    <!-- 表格区域：内部滚动 -->
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="products" stripe border height="100%" class="product-table">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }">
            <span class="product-emoji">{{ row.image }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column label="售价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="sales" label="销量" width="80" />
        <el-table-column label="评分" width="80">
          <template #default="{ row }">{{ row.rating }}</template>
        </el-table-column>
        <el-table-column label="标签" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag" size="small" class="tag-item" effect="plain" round>{{ tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row as Product)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row as Product)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="680px"
      destroy-on-close
      class="product-dialog"
      @closed="resetForm"
    >
      <el-form :model="form" label-width="88px" class="product-form">
        <div class="form-section">
          <div class="form-section-title">基本信息</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="名称" required>
                <el-input v-model="form.name" placeholder="商品名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类" required>
                <el-select v-model="form.category" style="width: 100%" @change="handleCategoryChange">
                  <el-option v-for="cat in categoryOptions" :key="cat.key" :label="cat.name" :value="cat.key" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="图标" required>
                <el-input v-model="form.image" placeholder="如 ☕ 🥤" maxlength="20" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="默认售价" required>
                <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="原价">
                <el-input-number v-model="form.originalPrice" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="描述" required>
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品描述" />
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="评分">
                <el-input-number v-model="form.rating" :min="0" :max="5" :step="0.1" :precision="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="库存">
                <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="销量">
                <el-input-number v-model="form.sales" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="form-section-title">标签 & 配料</div>
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入后回车添加标签" />
          </el-form-item>
          <el-form-item label="配料">
            <el-select v-model="form.ingredients" multiple filterable allow-create default-first-option style="width: 100%" placeholder="输入后回车添加配料" />
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="form-section-title">规格配置</div>
          <el-form-item label="规格" required>
            <div class="spec-list">
              <div v-for="(spec, index) in form.specs" :key="index" class="spec-row">
                <el-input v-model="spec.size" placeholder="规格名称（如 中杯/大杯）" />
                <span class="spec-price-label">价格</span>
                <el-input-number v-model="spec.price" :min="0" :precision="2" style="width: 130px" />
                <el-button text type="danger" :disabled="form.specs.length <= 1" @click="removeSpec(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button text type="primary" @click="addSpec">
                <el-icon style="margin-right:4px"><Plus /></el-icon>添加规格
              </el-button>
            </div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="dialogVisible = false">取消</el-button>
          <el-button size="large" type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, Search, Delete } from '@element-plus/icons-vue'
import type {
  Category,
  Product,
  ProductDeleteResponse,
  ProductFormData,
  ProductListResponse,
  ProductMutationResponse,
} from '~/types/product'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const loading = ref(false)
const saving = ref(false)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const total = ref(0)
const keyword = ref('')
const filterCategory = ref('')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

const categoryOptions = computed(() => categories.value.filter(c => c.key !== 'all'))

function createEmptyForm(): ProductFormData {
  return {
    name: '',
    category: 'coffee',
    categoryName: '咖啡',
    price: 0,
    originalPrice: undefined,
    description: '',
    image: '☕',
    tags: [],
    rating: 5,
    sales: 0,
    stock: 0,
    specs: [{ size: '', price: 0 }],
    ingredients: [],
  }
}

const form = ref<ProductFormData>(createEmptyForm())

async function fetchProducts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterCategory.value) params.set('category', filterCategory.value)
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    const query = params.toString()
    const url = query ? `/api/products?${query}` : '/api/products'
    const res = await $fetch<ProductListResponse>(url)
    if (res.success) {
      products.value = res.data.list
      categories.value = res.data.categories
      total.value = res.data.total
    }
  }
  finally {
    loading.value = false
  }
}

function handleCategoryChange(key: string) {
  const cat = categories.value.find(c => c.key === key)
  if (cat) form.value.categoryName = cat.name
}

function openCreate() {
  editingId.value = null
  form.value = createEmptyForm()
  dialogVisible.value = true
}

function openEdit(product: Product) {
  editingId.value = product.id
  form.value = {
    name: product.name,
    category: product.category,
    categoryName: product.categoryName,
    price: product.price,
    originalPrice: product.originalPrice,
    description: product.description,
    image: product.image,
    tags: [...product.tags],
    rating: product.rating,
    sales: product.sales,
    stock: product.stock,
    specs: product.specs.map(s => ({ ...s })),
    ingredients: product.ingredients ? [...product.ingredients] : [],
  }
  dialogVisible.value = true
}

function resetForm() {
  form.value = createEmptyForm()
  editingId.value = null
}

function addSpec() {
  form.value.specs.push({ size: '', price: 0 })
}

function removeSpec(index: number) {
  form.value.specs.splice(index, 1)
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = { ...form.value }
    if (!payload.originalPrice) delete payload.originalPrice

    const res = editingId.value
      ? await $fetch<ProductMutationResponse>(`/api/products/${editingId.value}`, { method: 'PUT', body: payload })
      : await $fetch<ProductMutationResponse>('/api/products', { method: 'POST', body: payload })

    if (!res.success) {
      ElMessage.error(res.message || '保存失败')
      return
    }

    ElMessage.success(editingId.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    await fetchProducts()
  }
  catch {
    ElMessage.error('保存失败')
  }
  finally {
    saving.value = false
  }
}

async function handleDelete(product: Product) {
  try {
    await ElMessageBox.confirm(`确定删除「${product.name}」吗？`, '删除确认', { type: 'warning' })
    const res = await $fetch<ProductDeleteResponse>(`/api/products/${product.id}`, { method: 'DELETE' })
    if (!res.success) {
      ElMessage.error(res.message || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    await fetchProducts()
  }
  catch {
    /* 用户取消 */
  }
}

onMounted(fetchProducts)
</script>

<style scoped lang="scss">
// 页面容器：撑满父级高度，内部 flex 布局
.manage-products {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

// ---- 顶部标题栏 ----
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;

  h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 4px;
  }
}

.page-desc {
  font-size: 13px;
  color: $text-secondary;
}

// ---- 筛选卡片 ----
.filter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 14px 18px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid $border;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-total {
  font-size: 13px;
  color: $text-secondary;
  white-space: nowrap;

  b {
    color: $text;
    font-weight: 600;
  }
}

// ---- 表格区域：内部滚动 ----
.table-wrapper {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid $border;
  overflow: hidden;
}

.product-table {
  width: 100%;

  // 去掉 el-table 自带的 border/bg，由外层卡片提供
  :deep(.el-table__inner-wrapper) {
    // 表头微调
    .el-table__header th {
      background: #fafafa;
      font-weight: 600;
      color: $text;
    }
  }
}

.product-emoji {
  font-size: 22px;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

// ---- 弹窗 ----
.product-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 0;
  }
  :deep(.el-dialog__body) {
    padding: 16px 24px 8px;
    max-height: 60vh;
    overflow-y: auto;
  }
  :deep(.el-dialog__footer) {
    padding: 12px 24px 20px;
  }
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-section {
  & + & {
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid $border;
  }
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
}

// ---- 规格列表 ----
.spec-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-row {
  display: flex;
  align-items: center;
  gap: 10px;

  > .el-input {
    flex: 1;
  }
}

.spec-price-label {
  font-size: 13px;
  color: $text-secondary;
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
