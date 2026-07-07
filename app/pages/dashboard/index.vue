<template>
  <div class="dashboard-page">
    <!-- 左栏：概览信息 -->
    <div class="overview-column">
      <h2>欢迎回来，{{ userStore.user?.username }}</h2>
      <p class="welcome-text">这是你的项目控制台，一切从这里开始。</p>
      <div class="info-cards">
        <div class="info-card">
          <div class="card-label">用户名</div>
          <div class="card-value">{{ userStore.user?.username }}</div>
        </div>
        <div class="info-card">
          <div class="card-label">注册时间</div>
          <div class="card-value">
            {{ formatDate(userStore.user?.created_at) }}
          </div>
        </div>
        <div class="info-card">
          <div class="card-label">项目数</div>
          <div class="card-value">1</div>
        </div>
      </div>
    </div>

    <!-- 右栏：AI 对话 -->
    <div class="chat-column">
      <div class="chat-panel">
        <div class="chat-header">
          <span class="chat-title">AI 助手</span>
          <el-button text size="small" @click="clearMessages"
            >清空对话</el-button
          >
        </div>

        <div ref="chatBodyRef" class="chat-body">
          <div v-if="messages.length === 0" class="chat-empty">
            <div class="chat-empty-icon">🤖</div>
            <div class="chat-empty-text">
              我是你的 AI 助手，有什么可以帮你的？
            </div>
            <div class="chat-suggestions">
              <span
                v-for="tip in quickTips"
                :key="tip"
                class="chat-suggestion-item"
                @click="sendMessage(tip)"
                >{{ tip }}</span
              >
            </div>
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-message"
            :class="msg.role"
          >
            <div class="chat-bubble">
              <!-- 思考过程折叠 -->
              <details v-if="msg.thinking" class="thinking-block">
                <summary>思考过程</summary>
                <p>{{ msg.thinking }}</p>
              </details>
              <!-- 消息内容 -->
              <div v-if="msg.loading && !msg.content" class="typing-dots">
                <span /><span /><span />
              </div>
              {{ msg.content }}
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="输入你的问题..."
            :disabled="isStreaming"
            resize="none"
            @keyup.enter.exact="handleSend"
          />
          <el-button
            type="primary"
            :disabled="!inputText.trim() || isStreaming"
            :loading="isStreaming"
            @click="handleSend"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});
const userStore = useUserStore();
const { messages, isStreaming, sendMessage, clearMessages } = useAiChat();

const inputText = ref("");
const chatBodyRef = ref<HTMLElement>();

const quickTips = [
  "添加商品：抹茶拿铁，价格28元，分类茶饮",
  "查看所有咖啡类商品",
  "在地图上搜索北京天安门",
];

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function handleSend() {
  const text = inputText.value.trim();
  if (!text || isStreaming.value) return;
  sendMessage(text, { context: "admin" });
  inputText.value = "";
}

// 自动滚动到最新消息
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
      }
    });
  },
);

// 监听消息内容变化（流式更新时也滚动）
watch(
  () => messages.value.at(-1)?.content,
  () => {
    nextTick(() => {
      if (chatBodyRef.value) {
        chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
      }
    });
  },
);
</script>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  gap: 24px;
  height: 100%;
  overflow: hidden;
}

// ---- 左栏 ----
.overview-column {
  flex: 1;
  min-width: 0;

  h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }
}

.welcome-text {
  color: $text-secondary;
  margin-bottom: 32px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-card {
  background: #fff;
  border-radius: $radius;
  padding: 24px;
  box-shadow: $shadow;

  .card-label {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 8px;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: $text;
  }
}

// ---- 右栏：AI 聊天面板 ----
.chat-column {
  width: 420px;
  flex-shrink: 0;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: $radius;
  box-shadow: $shadow;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;
}

.chat-title {
  font-size: 16px;
  font-weight: 600;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 48px;
}

.chat-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.chat-empty-text {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 20px;
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.chat-suggestion-item {
  font-size: 13px;
  color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.08);
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(64, 158, 255, 0.16);
  }
}

// ---- 消息气泡 ----
.chat-message {
  margin-bottom: 16px;

  &.user {
    display: flex;
    justify-content: flex-end;

    .chat-bubble {
      background: var(--el-color-primary);
      color: #fff;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    display: flex;
    justify-content: flex-start;

    .chat-bubble {
      background: $bg-gray;
      color: $text;
      border-radius: 16px 16px 16px 4px;
    }
  }
}

.chat-bubble {
  max-width: 85%;
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.thinking-block {
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.7;

  summary {
    cursor: pointer;
    color: $text-secondary;
  }

  p {
    margin-top: 6px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 6px;
    font-size: 12px;
  }
}

// ---- 打字动画 ----
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $text-secondary;
    animation: dot-bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// ---- 底部输入 ----
.chat-footer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid $border;
  flex-shrink: 0;

  :deep(.el-textarea__inner) {
    resize: none;
  }

  .el-button {
    flex-shrink: 0;
  }
}
</style>
