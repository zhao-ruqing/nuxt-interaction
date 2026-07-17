<template>
  <div class="void-dash-page void-dash-page--center">
    <div class="void-card personality-card">
      <div class="void-card__badge">
        <span class="void-card__pulse" />
        PERSONALITY
      </div>
      <LucideIcon name="brain" :size="52" class="personality-icon" />
      <h2 class="void-card__title">16Personalities 人格测试</h2>
      <p class="void-card__subtitle">
        该网站禁止被其他页面通过 iframe 嵌入，无法在当前控制台内直接显示。
        请点击下方按钮，在新窗口中完成测试。
      </p>
      <div class="personality-actions">
        <button class="void-btn void-btn--primary" @click="openTest">
          在新窗口打开测试
        </button>
        <button class="void-btn void-btn--ghost" @click="copyLink">
          复制链接
        </button>
      </div>
      <a
        class="personality-link"
        :href="PERSONALITY_URL"
        target="_blank"
        rel="noopener noreferrer"
        >{{ PERSONALITY_URL }}</a
      >
    </div>
  </div>
</template>

<script setup lang="ts">
const PERSONALITY_URL = "https://www.16personalities.com/zh";

definePageMeta({
  layout: "dashboard",
});

/** 在新窗口打开测试页 */
function openTest() {
  window.open(PERSONALITY_URL, "_blank", "noopener,noreferrer");
}

/** 复制测试链接到剪贴板 */
async function copyLink() {
  try {
    await navigator.clipboard.writeText(PERSONALITY_URL);
    ElMessage.success("链接已复制");
  } catch {
    ElMessage.error("复制失败，请手动复制链接");
  }
}
</script>

<style scoped lang="scss">
.personality-card {
  max-width: 520px;
  text-align: center;
}

.personality-icon {
  margin-bottom: 8px;
  color: var(--void-text);
}

.personality-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.personality-link {
  display: inline-block;
  font-family: var(--void-mono);
  font-size: 12px;
  color: var(--void-muted);
  word-break: break-all;

  &:hover {
    color: var(--void-text);
    text-decoration: underline;
  }
}
</style>
