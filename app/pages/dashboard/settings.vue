<template>
  <div class="void-dash-page">
    <div class="void-dash-header">
      <div>
        <span class="void-dash-eyebrow">XINGJIAN / SETTINGS</span>
        <h1>系统设置</h1>
        <p class="void-dash-desc">集中维护默认积分、围栏和排行榜参数</p>
      </div>
      <button class="admin-button" @click="save">保存设置</button>
    </div>
    <div class="settings-grid">
      <div v-for="item in settings" :key="item.key" class="setting-card">
        <label>{{ item.label }}</label>
        <p>{{ item.description }}</p>
        <el-input-number
          v-if="item.valueType === 'number'"
          v-model="values[item.key]"
          :min="0"
        /><el-switch
          v-else-if="item.valueType === 'boolean'"
          v-model="values[item.key]"
        /><el-input
          v-else
          v-model="values[item.key]"
          :disabled="item.key === 'payment_mode'"
        /><code>{{ item.key }}</code>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "admin" });
const settings = ref<any[]>([]);
const values = reactive<Record<string, any>>({});
async function load() {
  settings.value = (await $fetch<any>("/api/admin/settings")).data;
  for (const item of settings.value) {
    values[item.key] =
      item.valueType === "number"
        ? Number(item.value)
        : item.valueType === "boolean"
          ? item.value === "true"
          : item.value;
  }
}
async function save() {
  try {
    const response = await $fetch<any>("/api/admin/settings", {
      method: "PUT",
      body: values,
    });
    ElMessage.success(response.message);
    await load();
  } catch (e: any) {
    ElMessage.error(e?.data?.message || "保存失败");
  }
}
await load();
</script>
<style scoped lang="scss">
@use "@/styles/xingjian-admin.scss" as *;
.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.setting-card {
  padding: 22px;
  border: 1px solid var(--xj-border);
  border-radius: 12px;
  background: var(--xj-surface);
}
.setting-card label {
  display: block;
  color: var(--xj-text);
  font-weight: 700;
}
.setting-card p {
  min-height: 42px;
  margin: 8px 0 18px;
  color: var(--xj-muted);
  line-height: 1.5;
}
.setting-card code {
  display: block;
  margin-top: 16px;
  color: var(--xj-faint);
}
</style>
