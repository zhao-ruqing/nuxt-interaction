<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / ROUTES</span>
        <h1>路线管理</h1>
        <p class="void-dash-desc">编排路线点位顺序与完成奖励</p>
      </div>
      <button class="admin-button" @click="openCreate">新增路线</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>路线</th>
            <th>城市</th>
            <th>点位数</th>
            <th>难度</th>
            <th>时长</th>
            <th>奖励</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.name }}</strong
              ><small>{{ item.description }}</small>
            </td>
            <td>{{ item.cityName }}</td>
            <td>{{ item.pointIds.length }}</td>
            <td>{{ item.difficulty }}</td>
            <td>{{ item.estimatedMinutes }} 分钟</td>
            <td class="highlight">+{{ item.pointsReward }}</td>
            <td>
              <button class="admin-link" @click="openEdit(item)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <el-dialog
      v-model="visible"
      :title="editingId ? '编辑路线' : '新增路线'"
      width="720px"
      ><el-form label-position="top"
        ><div class="form-grid">
          <el-form-item label="城市"
            ><el-select v-model="form.cityId" @change="form.pointIds = []"
              ><el-option
                v-for="city in cities"
                :key="city.id"
                :label="city.name"
                :value="city.id" /></el-select></el-form-item
          ><el-form-item label="路线名称"
            ><el-input v-model="form.name" /></el-form-item
          ><el-form-item label="难度"
            ><el-select v-model="form.difficulty"
              ><el-option label="轻松" value="easy" /><el-option
                label="普通"
                value="normal" /><el-option
                label="挑战"
                value="hard" /></el-select></el-form-item
          ><el-form-item label="预计分钟"
            ><el-input-number
              v-model="form.estimatedMinutes"
              :min="1" /></el-form-item
          ><el-form-item label="完成奖励"
            ><el-input-number
              v-model="form.pointsReward"
              :min="0" /></el-form-item
          ><el-form-item label="状态"
            ><el-select v-model="form.status"
              ><el-option label="已发布" value="published" /><el-option
                label="草稿"
                value="draft" /><el-option
                label="停用"
                value="disabled" /></el-select
          ></el-form-item>
        </div>
        <el-form-item label="路线点位（选择顺序即展示顺序）"
          ><el-select v-model="form.pointIds" multiple style="width: 100%"
            ><el-option
              v-for="point in availablePoints"
              :key="point.id"
              :label="point.name"
              :value="point.id" /></el-select></el-form-item
        ><el-form-item label="路线介绍"
          ><el-input
            v-model="form.description"
            type="textarea"
            :rows="3" /></el-form-item></el-form
      ><template #footer
        ><el-button @click="visible = false">取消</el-button
        ><el-button type="primary" @click="save">保存</el-button></template
      ></el-dialog
    >
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
const items = ref<any[]>([]),
  cities = ref<any[]>([]),
  points = ref<any[]>([]),
  visible = ref(false),
  editingId = ref<number | null>(null);
const blank = () => ({
  cityId: cities.value[0]?.id || 0,
  name: "",
  description: "",
  difficulty: "easy",
  estimatedMinutes: 90,
  pointsReward: 30,
  status: "published",
  pointIds: [] as number[],
});
const form = reactive(blank());
const availablePoints = computed(() =>
  points.value.filter((p) => p.cityId === form.cityId),
);
async function load() {
  const [r, c, p] = await Promise.all([
    $fetch<any>("/api/admin/routes"),
    $fetch<any>("/api/admin/cities"),
    $fetch<any>("/api/admin/points"),
  ]);
  items.value = r.data;
  cities.value = c.data;
  points.value = p.data;
}
function openCreate() {
  editingId.value = null;
  Object.assign(form, blank());
  visible.value = true;
}
function openEdit(i: any) {
  editingId.value = i.id;
  Object.assign(form, i, { pointIds: [...i.pointIds] });
  visible.value = true;
}
async function save() {
  try {
    await $fetch(
      editingId.value
        ? `/api/admin/routes/${editingId.value}`
        : "/api/admin/routes",
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
