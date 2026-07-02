<template>
  <button
    class="page-agent-trigger"
    :class="{ active: isOpen }"
    type="button"
    :title="isOpen ? '关闭页面助手' : '打开页面助手'"
    @click="toggle"
  >
    <span class="trigger-icon">⚡</span>
    <span class="trigger-label">页面助手</span>
  </button>
</template>

<script setup lang="ts">
const { isOpen, toggle } = usePageAgentPanel()
</script>

<style scoped lang="scss">
.page-agent-trigger {
  position: fixed;
  top: 12px;
  right: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba($primary, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: $primary;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: $shadow-md;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    background: $primary;
    color: #fff;
    border-color: $primary;
  }

  &.active {
    background: $primary;
    color: #fff;
    border-color: $primary-dark;
  }
}

.trigger-icon {
  font-size: 14px;
  line-height: 1;
}
</style>
