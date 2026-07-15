<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / MALL</span>
        <h1>积分商品</h1>
        <p class="void-dash-desc">维护积分价格、库存和商品类型</p>
      </div>
      <button class="admin-button" @click="openCreate">新增商品</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>商品</th>
            <th>类型</th>
            <th>积分</th>
            <th>库存</th>
            <th>已兑</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.name }}</strong
              ><small>{{ item.description }}</small>
            </td>
            <td>{{ item.productType }}</td>
            <td class="highlight">{{ item.pointsPrice }}</td>
            <td>{{ item.stock }}</td>
            <td>{{ item.exchangedCount }}</td>
            <td>{{ item.status }}</td>
            <td>
              <button class="admin-link" @click="openEdit(item)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <el-dialog
      v-model="visible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="620px"
      ><el-form label-position="top"
        ><div class="form-grid">
          <el-form-item label="名称"
            ><el-input v-model="form.name" /></el-form-item
          ><el-form-item label="类型"
            ><el-select v-model="form.productType"
              ><el-option label="实物" value="physical" /><el-option
                label="虚拟"
                value="virtual" /></el-select></el-form-item
          ><el-form-item label="积分价格"
            ><el-input-number
              v-model="form.pointsPrice"
              :min="1" /></el-form-item
          ><el-form-item label="库存"
            ><el-input-number v-model="form.stock" :min="0" /></el-form-item
          ><el-form-item label="状态"
            ><el-select v-model="form.status"
              ><el-option label="已发布" value="published" /><el-option
                label="草稿"
                value="draft" /><el-option
                label="售罄"
                value="sold_out" /></el-select
          ></el-form-item>
        </div>
        <el-form-item label="介绍"
          ><el-input
            v-model="form.description"
            type="textarea"
            :rows="4" /></el-form-item></el-form
      ><template #footer
        ><el-button @click="visible = false">取消</el-button
        ><el-button type="primary" @click="save">保存</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "auth" });
const items = ref<any[]>([]),
  visible = ref(false),
  editingId = ref<number | null>(null);
const blank = () => ({
  name: "",
  description: "",
  pointsPrice: 100,
  stock: 10,
  productType: "physical",
  status: "published",
});
const form = reactive(blank());
async function load() {
  items.value = (await $fetch<any>("/api/admin/mall-products")).data;
}
function openCreate() {
  editingId.value = null;
  Object.assign(form, blank());
  visible.value = true;
}
function openEdit(i: any) {
  editingId.value = i.id;
  Object.assign(form, i);
  visible.value = true;
}
async function save() {
  try {
    await $fetch(
      editingId.value
        ? `/api/admin/mall-products/${editingId.value}`
        : "/api/admin/mall-products",
      { method: editingId.value ? "PUT" : "POST", body: form },
    );
    ElMessage.success("保存成功");
    visible.value = false;
    await load();
  } catch (e: any) {
    ElMessage.error(e?.data?.message || "保存失败");
  }
}
await load();
</script>
<style scoped lang="scss">
@use "@/styles/xingjian-admin.scss" as *;
</style>
