<template>
  <div class="personality-page">
    <div class="personality-panel">
      <div class="personality-icon">🧠</div>
      <h2 class="personality-title">16Personalities 人格测试</h2>
      <p class="personality-desc">
        该网站禁止被其他页面通过 iframe 嵌入，无法在当前控制台内直接显示。
        请点击下方按钮，在新窗口中完成测试。
      </p>
      <div class="personality-actions">
        <el-button type="primary" size="large" @click="openTest">
          在新窗口打开测试
        </el-button>
        <el-button size="large" @click="copyLink">复制链接</el-button>
      </div>
      <a
        class="personality-link"
        :href="PERSONALITY_URL"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ PERSONALITY_URL }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const PERSONALITY_URL = "https://www.16personalities.com/zh";

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

function openTest() {
  window.open(PERSONALITY_URL, "_blank", "noopener,noreferrer");
}

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
.personality-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 56px);
  margin: -24px;
  background: linear-gradient(160deg, #f5f0ff 0%, #eef6ff 45%, #f8fafc 100%);
}

.personality-panel {
  width: min(520px, calc(100% - 48px));
  padding: 48px 40px;
  text-align: center;
  background: #fff;
  border-radius: $radius;
  box-shadow: $shadow;
}

.personality-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.personality-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: $text;
}

.personality-desc {
  font-size: 14px;
  line-height: 1.7;
  color: $text-secondary;
  margin-bottom: 28px;
}

.personality-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.personality-link {
  display: inline-block;
  font-size: 13px;
  color: var(--el-color-primary);
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}
</style>
