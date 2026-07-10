<template>
  <button
    id="errorBtn"
    class="void-sentry-trigger"
    type="button"
    title="触发测试错误（Sentry）"
    @click="triggerError"
  >
    <span class="void-sentry-trigger__dot" />
    Trigger Error
  </button>
</template>

<script setup lang="ts">
/** 触发 Sentry 测试错误 */
function triggerError() {
  const pageUrl = window.location.href;
  const message = `FUCK BUG!!!! [${pageUrl}]`;
  ElMessage.error(message);
  throw new Error(message);
}
</script>

<style scoped lang="scss">
.void-sentry-trigger {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid rgba(255, 120, 120, 0.35);
  border-radius: 100px;
  background: rgba(8, 8, 12, 0.82);
  color: #ff9a9a;
  font-family: var(--void-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  transition: background 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s;

  &:hover {
    background: rgba(255, 120, 120, 0.15);
    border-color: rgba(255, 120, 120, 0.55);
    color: #ffc4c4;
    box-shadow: 0 8px 40px rgba(255, 80, 80, 0.2);
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff6b6b;
    box-shadow: 0 0 8px rgba(255, 107, 107, 0.6);
    animation: void-sentry-pulse 2s ease infinite;
  }
}

@keyframes void-sentry-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
</style>
