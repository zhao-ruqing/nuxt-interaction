<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / USERS</span>
        <h1>用户管理</h1>
        <p class="void-dash-desc">查看用户积分、打卡、徽章及后台角色</p>
      </div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户</th>
            <th>角色</th>
            <th>当前积分</th>
            <th>累计积分</th>
            <th>打卡</th>
            <th>徽章</th>
            <th>注册时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>#{{ item.id }}</td>
            <td>
              <strong>{{ item.username }}</strong>
            </td>
            <td>
              <el-select
                v-model="item.role"
                size="small"
                @change="updateRole(item)"
                ><el-option label="普通用户" value="user" /><el-option
                  label="管理员"
                  value="admin"
              /></el-select>
            </td>
            <td class="highlight">{{ item.balance }}</td>
            <td>{{ item.totalEarned }}</td>
            <td>{{ item.checkinCount }}</td>
            <td>{{ item.badgeCount }}</td>
            <td>{{ new Date(item.createdAt).toLocaleString("zh-CN") }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
const items = ref<any[]>([]);
async function load() {
  items.value = (await $fetch<any>("/api/admin/users")).data;
}
async function updateRole(item: any) {
  try {
    await $fetch(`/api/admin/users/${item.id}/role`, {
      method: "PUT",
      body: { role: item.role },
    });
    ElMessage.success("角色已更新");
  } catch (e: any) {
    ElMessage.error(e?.data?.message || "更新失败");
    await load();
  }
}
await load();
</script>
<style scoped lang="scss">
@use "@/styles/xingjian-admin.scss" as *;
</style>
