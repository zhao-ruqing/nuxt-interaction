<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <h2>商品管理</h2>
        <p class="void-dash-desc">管理饮品商城的商品信息、规格与库存</p>
      </div>
      <el-button
        type="primary"
        size="large"
        data-ghost-target="btn-create"
        @click="openCreate"
      >
        <el-icon style="margin-right: 4px"><Plus /></el-icon>新增商品
      </el-button>
    </div>

    <div class="void-dash-filter">
      <div class="void-dash-filter__left">
        <el-select
          v-model="filterCategory"
          data-ghost-target="search-category"
          placeholder="全部分类"
          clearable
          style="width: 150px"
          @change="fetchProducts"
        >
          <el-option
            v-for="cat in categoryOptions"
            :key="cat.key"
            :label="cat.name"
            :value="cat.key"
          />
        </el-select>
        <el-input
          v-model="keyword"
          data-ghost-target="search-keyword"
          placeholder="搜索商品名称、描述、标签"
          clearable
          :prefix-icon="Search"
          style="width: 300px"
          @keyup.enter="fetchProducts"
          @clear="fetchProducts"
        />
        <el-button
          type="primary"
          data-ghost-target="btn-search"
          :loading="loading"
          @click="fetchProducts"
          >查询</el-button
        >
      </div>
      <span class="void-dash-filter__total">共 <b>{{ total }}</b> 件商品</span>
    </div>

    <div class="void-dash-table-wrap">
      <el-table
        v-loading="loading"
        :data="products"
        stripe
        border
        height="100%"
        class="product-table"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="图标" width="80" align="center">
          <template #default="{ row }">
            <span class="product-emoji">{{ row.image }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="名称"
          min-width="160"
          show-overflow-tooltip
        />
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
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              class="tag-item"
              effect="plain"
              round
              >{{ tag }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              :data-ghost-target="'edit-' + row.id"
              @click="openEdit(row as Product)"
              >编辑</el-button
            >
            <el-button
              link
              type="danger"
              size="small"
              :data-ghost-target="'delete-' + row.id"
              @click="handleDelete(row as Product)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      width="1060px"
      destroy-on-close
      align-center
      class="product-dialog"
      :show-close="false"
      @closed="resetForm"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-icon">{{ form.image || "☕" }}</div>
          <div class="dialog-header-text">
            <h3>{{ editingId ? "编辑商品" : "新增商品" }}</h3>
            <p>
              {{
                editingId ? "修改商品信息与规格配置" : "填写商品信息并配置规格"
              }}
            </p>
          </div>
          <button
            type="button"
            class="dialog-close-btn"
            aria-label="关闭"
            @click="dialogVisible = false"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="product-form">
        <div class="form-columns">
          <!-- 左栏：基本信息 -->
          <section class="form-card">
            <div class="form-card-head">
              <span class="form-card-icon"
                ><el-icon><Goods /></el-icon
              ></span>
              <div class="form-card-title">基本信息</div>
            </div>
            <div class="form-card-body">
              <el-form-item label="商品名称" required>
                <el-input
                  v-model="form.name"
                  data-ghost-target="form-name"
                  placeholder="如：生椰拿铁"
                />
              </el-form-item>
              <el-form-item label="分类" required>
                <el-select
                  v-model="form.category"
                  data-ghost-target="form-category"
                  style="width: 100%"
                  @change="handleCategoryChange"
                >
                  <el-option
                    v-for="cat in categoryOptions"
                    :key="cat.key"
                    :label="cat.name"
                    :value="cat.key"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="图标" required>
                <div class="icon-input-group">
                  <div class="icon-preview">{{ form.image || "☕" }}</div>
                  <el-input
                    v-model="form.image"
                    data-ghost-target="form-image"
                    placeholder="emoji，如 ☕ 🥤"
                    maxlength="20"
                  />
                </div>
              </el-form-item>
              <div class="inline-fields">
                <el-form-item label="默认售价" required>
                  <el-input-number
                    v-model="form.price"
                    data-ghost-target="form-price"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="原价">
                  <el-input-number
                    v-model="form.originalPrice"
                    data-ghost-target="form-original-price"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </div>
              <el-form-item label="商品描述" required>
                <el-input
                  v-model="form.description"
                  data-ghost-target="form-description"
                  type="textarea"
                  :rows="2"
                  placeholder="简要描述商品特色"
                />
              </el-form-item>
              <div class="stats-grid">
                <el-form-item label="评分">
                  <el-input-number
                    v-model="form.rating"
                    data-ghost-target="form-rating"
                    :min="0"
                    :max="5"
                    :step="0.1"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="库存">
                  <el-input-number
                    v-model="form.stock"
                    data-ghost-target="form-stock"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="销量">
                  <el-input-number
                    v-model="form.sales"
                    data-ghost-target="form-sales"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </div>
            </div>
          </section>

          <!-- 中栏：标签与配料 -->
          <section class="form-card">
            <div class="form-card-head">
              <span class="form-card-icon"
                ><el-icon><CollectionTag /></el-icon
              ></span>
              <div class="form-card-title">标签与配料</div>
            </div>
            <div class="form-card-body">
              <el-form-item label="标签">
                <el-select
                  v-model="form.tags"
                  data-ghost-target="form-tags"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  placeholder="输入后回车添加"
                />
              </el-form-item>
              <el-form-item label="配料">
                <el-select
                  v-model="form.ingredients"
                  data-ghost-target="form-ingredients"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  style="width: 100%"
                  placeholder="输入后回车添加"
                />
              </el-form-item>
            </div>
          </section>

          <!-- 右栏：规格配置 -->
          <section class="form-card">
            <div class="form-card-head">
              <span class="form-card-icon"
                ><el-icon><List /></el-icon
              ></span>
              <div class="form-card-head-main">
                <div class="form-card-title">规格配置</div>
                <el-button
                  type="primary"
                  plain
                  size="small"
                  data-ghost-target="btn-add-spec"
                  @click="addSpec"
                >
                  <el-icon style="margin-right: 4px"><Plus /></el-icon>添加
                </el-button>
              </div>
            </div>
            <div class="form-card-body spec-card-body">
              <div class="spec-table">
                <div class="spec-table-head">
                  <span>规格名称</span>
                  <span>价格 (¥)</span>
                  <span />
                </div>
                <div
                  v-for="(spec, index) in form.specs"
                  :key="index"
                  class="spec-table-row"
                >
                  <el-input
                    v-model="spec.size"
                    :data-ghost-target="'spec-size-' + index"
                    placeholder="中杯 / 大杯"
                  />
                  <el-input-number
                    v-model="spec.price"
                    :data-ghost-target="'spec-price-' + index"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                  />
                  <el-button
                    class="spec-delete-btn"
                    text
                    type="danger"
                    :disabled="form.specs.length <= 1"
                    @click="removeSpec(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <span class="dialog-footer-tip"
            >带 <span class="required-mark">*</span> 为必填项</span
          >
          <div class="dialog-footer-actions">
            <el-button
              data-ghost-target="btn-cancel"
              @click="dialogVisible = false"
              >取消</el-button
            >
            <el-button
              type="primary"
              data-ghost-target="btn-save"
              :loading="saving"
              @click="handleSubmit"
              >保存商品</el-button
            >
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  Close,
  CollectionTag,
  Delete,
  Goods,
  List,
  Plus,
  Search,
} from "@element-plus/icons-vue";
import { useAdminAutomationStore } from '~/stores/adminAutomation'
import type {
  Category,
  Product,
  ProductDeleteResponse,
  ProductFormData,
  ProductListResponse,
  ProductMutationResponse,
} from "~/types/product";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

const loading = ref(false);
const saving = ref(false);
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const total = ref(0);
const keyword = ref("");
const filterCategory = ref("");
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const categoryOptions = computed(() =>
  categories.value.filter((c) => c.key !== "all"),
);

function createEmptyForm(): ProductFormData {
  return {
    name: "",
    category: "coffee",
    categoryName: "咖啡",
    price: 0,
    originalPrice: undefined,
    description: "",
    image: "☕",
    tags: [],
    rating: 5,
    sales: 0,
    stock: 0,
    specs: [{ size: "", price: 0 }],
    ingredients: [],
  };
}

const form = ref<ProductFormData>(createEmptyForm());

async function fetchProducts() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filterCategory.value) params.set("category", filterCategory.value);
    if (keyword.value.trim()) params.set("keyword", keyword.value.trim());
    const query = params.toString();
    const url = query ? `/api/products?${query}` : "/api/products";
    const res = await $fetch<ProductListResponse>(url);
    if (res.success) {
      products.value = res.data.list;
      categories.value = res.data.categories;
      total.value = res.data.total;
    }
  } finally {
    loading.value = false;
  }
}

function handleCategoryChange(key: string) {
  const cat = categories.value.find((c) => c.key === key);
  if (cat) form.value.categoryName = cat.name;
}

function openCreate() {
  editingId.value = null;
  form.value = createEmptyForm();
  dialogVisible.value = true;
}

function openEdit(product: Product) {
  editingId.value = product.id;
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
    specs: product.specs.map((s) => ({ ...s })),
    ingredients: product.ingredients ? [...product.ingredients] : [],
  };
  dialogVisible.value = true;
}

function resetForm() {
  form.value = createEmptyForm();
  editingId.value = null;
}

function addSpec() {
  form.value.specs.push({ size: "", price: 0 });
}

function removeSpec(index: number) {
  form.value.specs.splice(index, 1);
}

async function handleSubmit() {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (!payload.originalPrice) delete payload.originalPrice;

    const res = editingId.value
      ? await $fetch<ProductMutationResponse>(
          `/api/products/${editingId.value}`,
          { method: "PUT", body: payload },
        )
      : await $fetch<ProductMutationResponse>("/api/products", {
          method: "POST",
          body: payload,
        });

    if (!res.success) {
      ElMessage.error(res.message || "保存失败");
      return;
    }

    ElMessage.success(editingId.value ? "更新成功" : "创建成功");
    dialogVisible.value = false;
    await fetchProducts();
  } catch {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(product: Product) {
  try {
    await ElMessageBox.confirm(`确定删除「${product.name}」吗？`, "删除确认", {
      type: "warning",
    });
    const res = await $fetch<ProductDeleteResponse>(
      `/api/products/${product.id}`,
      { method: "DELETE" },
    );
    if (!res.success) {
      ElMessage.error(res.message || "删除失败");
      return;
    }
    ElMessage.success("删除成功");
    await fetchProducts();
  } catch {
    /* 用户取消 */
  }
}

onMounted(async () => {
  await fetchProducts();

  // 检查是否有来自 AI 的自动化任务
  const adminStore = useAdminAutomationStore();
  if (adminStore.task?.status === "pending") {
    const { run } = useAdminAutomation();
    // 延迟执行，确保页面完全渲染
    setTimeout(() => run(), 500);
  }

  // 处理 URL 查询参数（用于 PRODUCT_SEARCH 等自动筛选场景）
  const route = useRoute();
  const qCategory = route.query.category as string;
  const qKeyword = route.query.keyword as string;
  if (qCategory || qKeyword) {
    if (qCategory) filterCategory.value = qCategory;
    if (qKeyword) keyword.value = qKeyword;
    await fetchProducts();
  }
});
</script>

<style scoped lang="scss">
.product-table {
  width: 100%;
}

.product-emoji {
  font-size: 22px;
}

.tag-item {
  margin-right: 4px;
  margin-bottom: 4px;
}

.product-dialog {
  :deep(.el-dialog) {
    border-radius: var(--void-radius);
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 0 20px 4px;
    overflow: visible;
  }

  :deep(.el-dialog__footer) {
    padding: 14px 20px 18px;
    border-top: 1px solid var(--void-border);
    background: rgba(255, 255, 255, 0.02);
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--void-border);
}

.dialog-header-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--void-radius-sm);
  border: 1px solid var(--void-border);
}

.dialog-header-text {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 17px;
    font-weight: 700;
    color: var(--void-text);
    margin: 0 0 2px;
  }

  p {
    font-size: 12px;
    color: var(--void-muted);
    margin: 0;
  }
}

.dialog-close-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--void-radius-sm);
  background: transparent;
  color: var(--void-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--void-text);
  }
}

.product-form {
  padding: 0 0 8px;
}

.form-columns {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr 0.85fr;
  gap: 14px;
  align-items: stretch;
}

.form-card {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
  overflow: hidden;
  min-height: 0;
}

.form-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--void-border);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.form-card-head-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-card-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--void-radius-sm);
  background: rgba(255, 255, 255, 0.08);
  color: var(--void-text);
  font-size: 15px;
}

.form-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--void-text);
  line-height: 1.3;
}

.form-card-body {
  flex: 1;
  padding: 12px 14px 6px;
}

.required-mark {
  color: #ff8a8a;
  margin-left: 2px;
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-row {
  display: grid;
  grid-template-columns: 1fr 80px 32px;
  gap: 8px;
  align-items: center;
}

.spec-remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
  background: transparent;
  color: var(--void-muted);
  cursor: pointer;

  &:hover {
    color: #ff8a8a;
    border-color: rgba(255, 120, 120, 0.4);
  }
}

.add-spec-btn {
  margin-top: 8px;
  width: 100%;
}

@media (max-width: 1024px) {
  .form-columns {
    grid-template-columns: 1fr;
  }
}

.inline-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.icon-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  .el-form-item {
    margin-bottom: 0;
  }
}

.spec-card-body {
  padding-top: 10px;
}

.spec-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spec-table-head {
  display: grid;
  grid-template-columns: 1fr 108px 32px;
  gap: 8px;
  padding: 0 2px 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--void-muted);
}

.spec-table-row {
  display: grid;
  grid-template-columns: 1fr 108px 32px;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--void-border-hover);
  }

  .el-input-number {
    width: 100%;
  }
}

.spec-delete-btn {
  justify-self: center;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dialog-footer-tip {
  font-size: 12px;
  color: var(--void-muted);
}

.dialog-footer-actions {
  display: flex;
  gap: 10px;
}
</style>
