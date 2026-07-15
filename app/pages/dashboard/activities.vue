<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / ACTIVITIES</span>
        <h1>活动管理</h1>
        <p class="void-dash-desc">维护活动时间、容量、费用和积分奖励</p>
      </div>
      <button class="admin-button" @click="openCreate">新增活动</button>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>活动</th>
            <th>城市</th>
            <th>开始时间</th>
            <th>报名</th>
            <th>费用</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <strong>{{ item.title }}</strong
              ><small>{{ item.venue }}</small>
            </td>
            <td>{{ item.cityName }}</td>
            <td>{{ formatDate(item.startsAt) }}</td>
            <td>{{ item.registeredCount }}/{{ item.capacity }}</td>
            <td>¥{{ item.price }}</td>
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
      :title="editingId ? '编辑活动' : '新增活动'"
      width="760px"
      ><el-form label-position="top"
        ><div class="form-grid form-grid--3">
          <el-form-item label="城市"
            ><el-select v-model="form.cityId"
              ><el-option
                v-for="city in cities"
                :key="city.id"
                :label="city.name"
                :value="city.id" /></el-select></el-form-item
          ><el-form-item label="活动名称"
            ><el-input v-model="form.title" /></el-form-item
          ><el-form-item label="场地"
            ><el-input v-model="form.venue" /></el-form-item
          ><el-form-item label="开始时间"
            ><input
              v-model="form.startsAt"
              class="native-input"
              type="datetime-local" /></el-form-item
          ><el-form-item label="结束时间"
            ><input
              v-model="form.endsAt"
              class="native-input"
              type="datetime-local" /></el-form-item
          ><el-form-item label="报名截止"
            ><input
              v-model="form.registrationDeadline"
              class="native-input"
              type="datetime-local" /></el-form-item
          ><el-form-item label="人数"
            ><el-input-number v-model="form.capacity" :min="1" /></el-form-item
          ><el-form-item label="价格"
            ><el-input-number
              v-model="form.price"
              :min="0"
              :precision="2" /></el-form-item
          ><el-form-item label="积分奖励"
            ><el-input-number v-model="form.pointsReward" :min="0"
          /></el-form-item>
        </div>
        <el-form-item label="介绍"
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
definePageMeta({ layout: "dashboard", middleware: "auth" });
const items = ref<any[]>([]),
  cities = ref<any[]>([]),
  visible = ref(false),
  editingId = ref<number | null>(null);
const blank = () => ({
  cityId: cities.value[0]?.id || 0,
  title: "",
  description: "",
  venue: "",
  startsAt: "",
  endsAt: "",
  registrationDeadline: "",
  capacity: 30,
  price: 0,
  pointsReward: 10,
  status: "published",
});
const form = reactive(blank());
const formatInput = (v: any) =>
  v ? new Date(v).toISOString().slice(0, 16) : "";
const formatDate = (v: any) => new Date(v).toLocaleString("zh-CN");
async function load() {
  const [a, c] = await Promise.all([
    $fetch<any>("/api/admin/activities"),
    $fetch<any>("/api/admin/cities"),
  ]);
  items.value = a.data;
  cities.value = c.data;
}
function openCreate() {
  editingId.value = null;
  Object.assign(form, blank());
  visible.value = true;
}
function openEdit(i: any) {
  editingId.value = i.id;
  Object.assign(form, i, {
    startsAt: formatInput(i.startsAt),
    endsAt: formatInput(i.endsAt),
    registrationDeadline: formatInput(i.registrationDeadline),
  });
  visible.value = true;
}
async function save() {
  try {
    await $fetch(
      editingId.value
        ? `/api/admin/activities/${editingId.value}`
        : "/api/admin/activities",
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
.native-input {
  width: 100%;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 10px;
}
</style>
