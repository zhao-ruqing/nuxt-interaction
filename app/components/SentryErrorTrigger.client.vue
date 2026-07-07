<template>
  <button
    id="errorBtn"
    class="sentry-error-trigger"
    type="button"
    title="触发测试错误（Sentry）"
    @click="triggerError"
  >
    Trigger Error
  </button>
</template>

<script setup lang="ts">
function triggerError() {
  const pageUrl = window.location.href
  const message = `FUCK BUG!!!! [${pageUrl}]`
  ElMessage.error(message)
  throw new Error(message)
}
</script>

<style scoped lang="scss">
.sentry-error-trigger {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1000;
  padding: 8px 14px;
  border: 1px solid rgba(245, 108, 108, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: #f56c6c;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: $shadow-md;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    background: #f56c6c;
    color: #fff;
    border-color: #f56c6c;
  }
}
</style>
