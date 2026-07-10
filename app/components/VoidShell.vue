<!--
  VOID 沉浸式页面外壳
  用法：<VoidShell>页面内容</VoidShell>
-->
<template>
  <div
    class="void"
    :class="{ 'void--mobile': isMobile }"
    @mousemove="onMouseMove"
  >
    <template v-if="!isMobile">
      <div
        class="void-cursor__ring"
        :class="{ 'void-cursor__ring--hover': cursorHover }"
        :style="cursorRingStyle"
      />
      <div class="void-cursor__dot" :style="cursorDotStyle" />
    </template>

    <div class="void-noise" />
    <div class="void-scanlines" />
    <div class="void-grid" />

    <slot />
  </div>
</template>

<script setup lang="ts">
const {
  isMobile,
  cursorHover,
  cursorDotStyle,
  cursorRingStyle,
  onMouseMove,
  bindMagnetic,
} = useVoidPage();

onMounted(() => {
  nextTick(() => bindMagnetic());
});
</script>
