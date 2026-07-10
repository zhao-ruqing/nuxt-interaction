<template>
  <button
    class="void-float-trigger"
    :class="{ 'void-float-trigger--active': isOpen }"
    type="button"
    :title="isOpen ? '关闭页面助手' : '打开页面助手'"
    @click="toggle"
  >
    <span class="void-float-trigger__icon">◇</span>
    <span class="void-float-trigger__label">页面助手</span>
  </button>
</template>

<script setup lang="ts">
const { isOpen, toggle } = usePageAgentPanel()
</script>

<style scoped lang="scss">
.void-float-trigger {
  position: fixed;
  top: 16px;
  right: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--void-border);
  border-radius: 100px;
  background: rgba(8, 8, 12, 0.82);
  color: var(--void-text);
  font-family: var(--void-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  transition: background 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s;

  &:hover {
    border-color: var(--void-border-hover);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
  }

  &--active {
    background: #fff;
    color: #000;
    border-color: #fff;

    .void-float-trigger__icon {
      color: #000;
    }

    &:hover {
      background: #e8e8e8;
      border-color: #e8e8e8;
    }
  }

  &__icon {
    font-size: 10px;
    line-height: 1;
    color: var(--void-muted);
    transition: color 0.25s;
  }

  &--active &__icon {
    animation: void-trigger-pulse 2s ease infinite;
  }
}

@keyframes void-trigger-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

@media (max-width: 768px) {
  .void-float-trigger__label {
    display: none;
  }

  .void-float-trigger {
    padding: 10px 12px;
  }
}
</style>
