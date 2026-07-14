<!--
  VOID 沉浸式页面外壳（非首页）
  用法：<VoidShell>页面内容</VoidShell>
  不含自定义光标，使用系统默认鼠标样式
-->
<template>
  <div class="void" :class="{ 'void--mobile': isMobile }">
    <div class="void-noise" />
    <div class="void-scanlines" />
    <div class="void-grid" />

    <slot />
  </div>
</template>

<script setup lang="ts">
const { isMobile, bindMagnetic } = useVoidPage();

onMounted(() => {
  nextTick(() => bindMagnetic());
});
</script>
