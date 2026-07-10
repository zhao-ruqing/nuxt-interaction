<template>
  <div
    ref="widgetRef"
    class="ai-widget"
    :class="{ dragging: isDragging }"
    :style="widgetStyle"
  >
    <!-- 悬浮按钮 -->
    <button
      class="fab"
      :class="{ active: isOpen }"
      aria-label="打开 AI 助手"
      @pointerdown="(e) => startDrag(e, 'fab')"
      @pointermove="onDrag"
      @pointerup="(e) => endDrag(e, 'fab')"
      @pointercancel="(e) => endDrag(e, 'fab')"
    >
      <span v-if="!isOpen" class="fab-icon">◇</span>
      <span v-else class="fab-icon">✕</span>
    </button>

    <!-- 对话面板 -->
    <Transition name="panel">
      <div
        v-if="isOpen"
        class="chat-panel"
        :class="{ 'panel-below': panelBelow }"
      >
        <div
          class="panel-header"
          @pointerdown="(e) => startDrag(e, 'header')"
          @pointermove="onDrag"
          @pointerup="(e) => endDrag(e, 'header')"
          @pointercancel="(e) => endDrag(e, 'header')"
        >
          <div class="header-info">
            <span class="header-icon">◇</span>
            <div>
              <h3>饮品 AI 助手</h3>
              <p>试试说「帮我点一杯咖啡」</p>
            </div>
          </div>
          <button class="clear-btn" title="清空对话" @pointerdown.stop @click="clearMessages">清空</button>
        </div>

        <div ref="messageListRef" class="message-list">
          <div v-if="!messages.length" class="welcome">
            <p>你好！我是饮品商城 AI 助手</p>
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
import { useOrderAutomationStore } from '~/stores/orderAutomation'

const { messages, isStreaming, sendMessage, clearMessages } = useAiChat()
const orderStore = useOrderAutomationStore()

const isOpen = ref(false)
const inputText = ref('')
const messageListRef = ref<HTMLElement>()
const widgetRef = ref<HTMLElement>()

const pos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const hasMoved = ref(false)
const dragState = { startX: 0, startY: 0, originX: 0, originY: 0 }

const widgetStyle = computed(() => ({
  left: `${pos.value.x}px`,
  top: `${pos.value.y}px`,
}))

const panelBelow = computed(() => pos.value.y < 592)

function getEdgeMargin() {
  return window.innerWidth <= 640 ? 16 : 24
}

function clampPosition(x: number, y: number) {
  const el = widgetRef.value
  if (!el) return { x, y }
  const maxX = Math.max(0, window.innerWidth - el.offsetWidth)
  const maxY = Math.max(0, window.innerHeight - el.offsetHeight)
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  }
}

function initPosition() {
  const el = widgetRef.value
  if (!el) return
  const margin = getEdgeMargin()
  pos.value = clampPosition(
    window.innerWidth - el.offsetWidth - margin,
    window.innerHeight - el.offsetHeight - margin,
  )
}

function startDrag(e: PointerEvent, _source: 'fab' | 'header') {
  if (e.button !== 0) return
  isDragging.value = true
  hasMoved.value = false
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = pos.value.x
  dragState.originY = pos.value.y
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onDrag(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.value = true
  pos.value = clampPosition(dragState.originX + dx, dragState.originY + dy)
}

function endDrag(e: PointerEvent, source: 'fab' | 'header') {
  if (!isDragging.value) return
  const moved = hasMoved.value
  isDragging.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  catch { /* 已释放 */ }
  if (!moved && source === 'fab') togglePanel()
}

function onWindowResize() {
  pos.value = clampPosition(pos.value.x, pos.value.y)
}

const orderStatusText = computed(() => {
  const o = orderStore.pending
  if (!o) return ''
  const map: Record<string, string> = {
    pending: '⏳ 正在跳转到商品页...',
    running: '👆 幽灵手正在选择规格与数量...',
    done: `✅ ${o.message || '已跳转支付页，请确认支付'}`,
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

onMounted(() => {
  nextTick(initPosition)
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
})
</script>

<style scoped lang="scss">
.ai-widget {
  position: fixed;
  z-index: 1000;
  touch-action: none;
  font-family: var(--void-display);

  &.dragging .fab {
    transform: none;
    cursor: grabbing;
  }
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--void-border);
  background: rgba(8, 8, 12, 0.9);
  color: var(--void-text);
  font-size: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(16px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.06);
    border-color: var(--void-border-hover);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.55);
  }

  &.active {
    background: #fff;
    color: #000;
    border-color: #fff;
  }
}

.chat-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: 380px;
  height: 520px;
  background: rgba(8, 8, 12, 0.94);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.panel-below {
    top: 72px;
    bottom: auto;
  }
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
  border-bottom: 1px solid var(--void-border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--void-text);
  cursor: grab;
  touch-action: none;
  user-select: none;

  h3 {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  p {
    font-size: 12px;
    color: var(--void-muted);
    margin-top: 2px;
  }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 16px;
  color: var(--void-muted);
}

.clear-btn {
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
  padding: 6px 12px;
  border: 1px solid var(--void-border);
  border-radius: 100px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: var(--void-text);
    border-color: var(--void-border-hover);
  }
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: transparent;
}

.welcome {
  text-align: center;
  padding: 24px 8px;
  color: var(--void-muted);
  font-size: 14px;
  line-height: 1.6;

  p:first-child {
    font-size: 15px;
    color: var(--void-text);
    font-weight: 600;
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
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--void-border);
    border-radius: 100px;
    font-size: 13px;
    color: var(--void-text);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--void-border-hover);
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.message {
  display: flex;
  margin-bottom: 12px;

  &.user {
    justify-content: flex-end;

    .bubble {
      background: #fff;
      color: #000;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    justify-content: flex-start;

    .bubble {
      background: rgba(255, 255, 255, 0.06);
      color: var(--void-text);
      border: 1px solid var(--void-border);
      border-radius: 16px 16px 16px 4px;
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
    background: var(--void-muted);
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
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);

  .action-label {
    font-family: var(--void-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--void-muted);
    margin-bottom: 6px;
  }

  pre {
    font-family: var(--void-mono);
    font-size: 11px;
    color: var(--void-text);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }

  .action-status {
    font-size: 12px;
    color: var(--void-text);
    font-weight: 500;
    margin-top: 8px;
  }
}

.thinking-block {
  margin-top: 8px;
  font-size: 12px;
  color: var(--void-muted);

  summary {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--void-text);
    }
  }

  p {
    margin-top: 6px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.04);
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
  border-top: 1px solid var(--void-border);
  background: rgba(255, 255, 255, 0.02);

  textarea {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--void-border);
    border-radius: var(--void-radius-sm);
    background: rgba(255, 255, 255, 0.04);
    color: var(--void-text);
    font-size: 14px;
    font-family: inherit;
    resize: none;
    outline: none;
    line-height: 1.4;
    max-height: 80px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.28);
    }

    &:focus {
      border-color: var(--void-border-hover);
      background: rgba(255, 255, 255, 0.06);
    }

    &:disabled {
      opacity: 0.6;
    }
  }
}

.send-btn {
  align-self: flex-end;
  padding: 10px 18px;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: box-shadow 0.2s, opacity 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

@media (max-width: $breakpoint-sm) {
  .chat-panel {
    width: calc(100vw - 32px);
    height: calc(100vh - 120px);
    max-height: 520px;
  }
}
</style>
