<template>
  <div class="ai-widget">
    <!-- 悬浮按钮 -->
    <button
      class="fab"
      :class="{ active: isOpen }"
      aria-label="打开 AI 助手"
      @click="togglePanel"
    >
      <span v-if="!isOpen" class="fab-icon">🤖</span>
      <span v-else class="fab-icon">✕</span>
    </button>

    <!-- 对话面板 -->
    <Transition name="panel">
      <div v-if="isOpen" class="chat-panel">
        <div class="panel-header">
          <div class="header-info">
            <span class="header-icon">🤖</span>
            <div>
              <h3>饮品 AI 助手</h3>
              <p>试试说「帮我点一杯咖啡」</p>
            </div>
          </div>
          <button class="clear-btn" title="清空对话" @click="clearMessages">清空</button>
        </div>

        <div ref="messageListRef" class="message-list">
          <div v-if="!messages.length" class="welcome">
            <p>你好！我是饮品商城 AI 助手 👋</p>
            <p>可以帮你推荐饮品、查询商品，或直接帮你下单。</p>
            <div class="quick-prompts">
              <button
                v-for="prompt in quickPrompts"
                :key="prompt"
                @click="handleSend(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message"
            :class="msg.role"
          >
            <div class="bubble">
              <template v-if="msg.loading && !msg.content">
                <span class="typing">
                  <span /><span /><span />
                </span>
              </template>
              <template v-else>
                <p v-if="msg.content" class="text">{{ msg.content }}</p>
                <!-- 思考过程（可折叠，默认隐藏） -->
                <details v-if="msg.thinking" class="thinking-block">
                  <summary>思考过程</summary>
                  <p>{{ msg.thinking }}</p>
                </details>
                <!-- 指令 JSON 预览（后续将触发页面跳转与幽灵手操作） -->
                <div v-if="msg.action" class="action-card">
                  <div class="action-label">操作指令</div>
                  <pre>{{ JSON.stringify(msg.action, null, 2) }}</pre>
                  <p v-if="msg.action.action === 'ORDER' && orderStatusText" class="action-status">
                    {{ orderStatusText }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="input-area">
          <textarea
            v-model="inputText"
            placeholder="输入消息，Enter 发送..."
            rows="1"
            :disabled="isStreaming"
            @keydown.enter.exact.prevent="handleSend()"
          />
          <button
            class="send-btn"
            :disabled="!inputText.trim() || isStreaming"
            @click="handleSend()"
          >
            {{ isStreaming ? '...' : '发送' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { messages, isStreaming, sendMessage, clearMessages } = useAiChat()
const orderStore = useOrderAutomationStore()

const isOpen = ref(false)
const inputText = ref('')
const messageListRef = ref<HTMLElement>()

const orderStatusText = computed(() => {
  const o = orderStore.pending
  if (!o) return ''
  const map: Record<string, string> = {
    pending: '⏳ 正在跳转到商品页...',
    running: '👆 幽灵手正在自动下单...',
    done: `✅ ${o.message || '下单完成'}`,
    failed: `❌ ${o.message || '下单失败'}`,
  }
  return map[o.status] || ''
})

const quickPrompts = [
  '帮我点一杯咖啡',
  '推荐几款热销饮品',
  '有什么无糖的选择？',
]

function togglePanel() {
  isOpen.value = !isOpen.value
}

async function handleSend(text?: string) {
  const query = text || inputText.value
  if (!query.trim() || isStreaming.value) return

  inputText.value = ''
  await sendMessage(query)
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })
</script>

<style scoped lang="scss">
.ai-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;
  font-size: 24px;
  box-shadow: 0 4px 20px rgba($primary, 0.45);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 28px rgba($primary, 0.55);
  }

  &.active {
    background: $text-secondary;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}

.chat-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
  color: #fff;

  h3 {
    font-size: 16px;
    font-weight: 600;
  }

  p {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 28px;
}

.clear-btn {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: $bg-gray;
}

.welcome {
  text-align: center;
  padding: 24px 8px;
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.6;

  p:first-child {
    font-size: 15px;
    color: $text;
    font-weight: 500;
    margin-bottom: 8px;
  }
}

.quick-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;

  button {
    padding: 10px 14px;
    background: #fff;
    border: 1px solid $border;
    border-radius: 8px;
    font-size: 13px;
    color: $text;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      color: $primary;
      background: rgba($primary, 0.04);
    }
  }
}

.message {
  display: flex;
  margin-bottom: 12px;

  &.user {
    justify-content: flex-end;

    .bubble {
      background: $primary;
      color: #fff;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    justify-content: flex-start;

    .bubble {
      background: #fff;
      color: $text;
      border-radius: 16px 16px 16px 4px;
      box-shadow: $shadow;
    }
  }
}

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    background: $text-muted;
    border-radius: 50%;
    animation: bounce 1.2s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.action-card {
  margin-top: 10px;
  padding: 10px;
  background: #f0f4ff;
  border: 1px solid rgba($primary, 0.2);
  border-radius: 8px;

  .action-label {
    font-size: 11px;
    font-weight: 600;
    color: $primary;
    margin-bottom: 6px;
  }

  pre {
    font-size: 12px;
    color: $text;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }

  .action-hint {
    font-size: 11px;
    color: $text-muted;
    margin-top: 6px;
  }

  .action-status {
    font-size: 12px;
    color: $primary;
    font-weight: 500;
    margin-top: 8px;
  }
}

.thinking-block {
  margin-top: 8px;
  font-size: 12px;
  color: $text-muted;

  summary {
    cursor: pointer;
    user-select: none;
    color: $text-secondary;

    &:hover {
      color: $text;
    }
  }

  p {
    margin-top: 6px;
    padding: 8px;
    background: $bg-gray;
    border-radius: 6px;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid $border;
  background: #fff;

  textarea {
    flex: 1;
    padding: 10px 12px;
    border: 1.5px solid $border;
    border-radius: 10px;
    font-size: 14px;
    resize: none;
    outline: none;
    font-family: inherit;
    line-height: 1.4;
    max-height: 80px;

    &:focus {
      border-color: $primary;
    }

    &:disabled {
      opacity: 0.6;
    }
  }
}

.send-btn {
  align-self: flex-end;
  padding: 10px 18px;
  background: $primary;
  color: #fff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: $primary-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@media (max-width: $breakpoint-sm) {
  .ai-widget {
    right: 16px;
    bottom: 16px;
  }

  .chat-panel {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    max-height: 520px;
  }
}
</style>
