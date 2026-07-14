<!--
  VOID 统一工具浮钮
  用法：在 app.vue 挂载 <VoidToolHub />
  主圆可拖拽并侧边吸附；点击展开三子圆（方向随边界）；AI 面板自动规避屏幕边缘
-->
<template>
  <div
    ref="hubRef"
    class="tool-hub"
    :class="{
      'tool-hub--dragging': isDragging,
      'tool-hub--menu': menuOpen,
      'tool-hub--snap': !isDragging,
    }"
    :style="hubStyle"
  >
    <!-- 展开的操作子圆 -->
    <TransitionGroup name="orb">
      <button
        v-for="(orb, i) in visibleOrbs"
        :id="orb.id"
        :key="orb.key"
        class="tool-hub__orb"
        :class="[
          `tool-hub__orb--${orb.key}`,
          { 'tool-hub__orb--active': orb.active },
        ]"
        type="button"
        :title="orb.label"
        :style="orbStyle(i)"
        @click.stop="onOrbClick(orb.key)"
      >
        <LucideIcon :name="orb.icon" :size="16" />
        <span class="tool-hub__orb-label">{{ orb.short }}</span>
      </button>
    </TransitionGroup>

    <!-- 主拖拽圆 -->
    <button
      class="tool-hub__fab"
      :class="{ 'tool-hub__fab--active': menuOpen || chatOpen }"
      type="button"
      :aria-label="fabLabel"
      @pointerdown="(e) => startDrag(e, 'fab')"
      @pointermove="onDrag"
      @pointerup="(e) => endDrag(e, 'fab')"
      @pointercancel="(e) => endDrag(e, 'fab')"
    >
      <LucideIcon v-if="menuOpen || chatOpen" name="x" :size="20" />
      <LucideIcon v-else name="layout-grid" :size="20" />
    </button>

    <!-- AI 对话面板 -->
    <Transition name="panel">
      <div v-if="chatOpen" class="tool-hub__panel" :style="panelStyle">
        <div
          class="tool-hub__panel-header"
          @pointerdown="(e) => startDrag(e, 'header')"
          @pointermove="onDrag"
          @pointerup="(e) => endDrag(e, 'header')"
          @pointercancel="(e) => endDrag(e, 'header')"
        >
          <div class="tool-hub__panel-info">
            <LucideIcon name="bot" :size="18" class="tool-hub__panel-icon" />
            <div>
              <h3>饮品 AI 助手</h3>
              <p>试试说「帮我点一杯咖啡」</p>
            </div>
          </div>
          <button
            class="tool-hub__clear"
            type="button"
            title="清空对话"
            @pointerdown.stop
            @click="clearMessages"
          >
            清空
          </button>
        </div>

        <div ref="messageListRef" class="tool-hub__messages">
          <div v-if="!messages.length" class="tool-hub__welcome">
            <p>你好！我是饮品商城 AI 助手</p>
            <p>可以帮你推荐饮品、查询商品，或直接帮你下单。</p>
            <div class="tool-hub__prompts">
              <button
                v-for="prompt in quickPrompts"
                :key="prompt"
                type="button"
                @click="handleSend(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="tool-hub__msg"
            :class="msg.role"
          >
            <div class="tool-hub__bubble">
              <template v-if="msg.loading && !msg.content">
                <span class="tool-hub__typing"> <span /><span /><span /> </span>
              </template>
              <template v-else>
                <p v-if="msg.content" class="tool-hub__text">
                  {{ msg.content }}
                </p>
                <details v-if="msg.thinking" class="tool-hub__thinking">
                  <summary>思考过程</summary>
                  <p>{{ msg.thinking }}</p>
                </details>
                <div v-if="msg.action" class="tool-hub__action">
                  <div class="tool-hub__action-label">操作指令</div>
                  <pre>{{ JSON.stringify(msg.action, null, 2) }}</pre>
                  <p
                    v-if="msg.action.action === 'ORDER' && orderStatusText"
                    class="tool-hub__action-status"
                  >
                    {{ orderStatusText }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="tool-hub__input">
          <textarea
            v-model="inputText"
            placeholder="输入消息，Enter 发送..."
            rows="1"
            :disabled="isStreaming"
            @keydown.enter.exact.prevent="handleSend()"
          />
          <button
            class="tool-hub__send"
            type="button"
            :disabled="!inputText.trim() || isStreaming"
            @click="handleSend()"
          >
            {{ isStreaming ? "..." : "发送" }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useOrderAutomationStore } from "~/stores/orderAutomation";

type OrbKey = "error" | "agent" | "ai";
type DragSource = "fab" | "header";

const FAB_SIZE = 56;
const ORB_SIZE = 48;
const ORB_RADIUS = 78;
const PANEL_GAP = 14;
const PANEL_IDEAL_W = 380;
const PANEL_IDEAL_H = 520;
const PANEL_MIN_H = 280;

/** 可选扇形方案（角度均为标准数学角，0° 向右、逆时针为正） */
const FAN_PRESETS: { key: string; angles: number[] }[] = [
  { key: "up", angles: [-150, -90, -30] },
  { key: "up-left", angles: [180, -135, -90] },
  { key: "up-right", angles: [-90, -45, 0] },
  { key: "left", angles: [150, 180, -150] },
  { key: "right", angles: [-30, 0, 30] },
  { key: "down", angles: [30, 90, 150] },
  { key: "down-left", angles: [90, 135, 180] },
  { key: "down-right", angles: [0, 45, 90] },
];

const { messages, isStreaming, sendMessage, clearMessages } = useAiChat();
const orderStore = useOrderAutomationStore();
const ghostBusy = useGhostHandBusy();
const pageAgent = usePageAgentPanel();

const menuOpen = ref(false);
const chatOpen = ref(false);
const inputText = ref("");
const messageListRef = ref<HTMLElement>();
const hubRef = ref<HTMLElement>();

const pos = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const hasMoved = ref(false);
const dragState = { startX: 0, startY: 0, originX: 0, originY: 0 };

const quickPrompts = [
  "帮我点一杯咖啡",
  "推荐几款热销饮品",
  "有什么无糖的选择？",
];

const orbs = computed(() => [
  {
    key: "error" as const,
    id: "errorBtn",
    label: "Trigger Error",
    short: "ERR",
    icon: "bug",
    active: false,
  },
  {
    key: "agent" as const,
    id: undefined as string | undefined,
    label: "页面助手",
    short: "助手",
    icon: "sparkles",
    active: pageAgent.isOpen.value,
  },
  {
    key: "ai" as const,
    id: undefined as string | undefined,
    label: "AI 助手",
    short: "AI",
    icon: "bot",
    active: chatOpen.value,
  },
]);

const visibleOrbs = computed(() => (menuOpen.value ? orbs.value : []));

const hubStyle = computed(() => ({
  left: `${pos.value.x}px`,
  top: `${pos.value.y}px`,
}));

const fabLabel = computed(() => {
  if (chatOpen.value) return "关闭 AI 助手";
  if (menuOpen.value) return "收起工具菜单";
  return "打开工具菜单";
});

const orderStatusText = computed(() => {
  const o = orderStore.pending;
  if (!o) return "";
  const map: Record<string, string> = {
    pending: "⏳ 正在跳转到商品页...",
    running: "👆 幽灵手正在选择规格与数量...",
    done: `✅ ${o.message || "已跳转支付页，请确认支付"}`,
    failed: `❌ ${o.message || "下单失败"}`,
  };
  return map[o.status] || "";
});

/** 计算某组角度下三子圆中心的屏幕坐标 */
function getOrbCenters(angles: number[]) {
  const cx = pos.value.x + FAB_SIZE / 2;
  const cy = pos.value.y + FAB_SIZE / 2;
  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * ORB_RADIUS,
      y: cy + Math.sin(rad) * ORB_RADIUS,
    };
  });
}

/** 评估扇形方案溢出视口的像素总量（越小越好） */
function measureFanOverflow(angles: number[]) {
  if (!import.meta.client) return 0;
  const margin = 10;
  const half = ORB_SIZE / 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let overflow = 0;
  for (const c of getOrbCenters(angles)) {
    overflow += Math.max(0, margin - (c.x - half));
    overflow += Math.max(0, c.x + half - (vw - margin));
    overflow += Math.max(0, margin - (c.y - half));
    overflow += Math.max(0, c.y + half - (vh - margin));
  }
  return overflow;
}

/** 按主圆位置选出无裁切 / 裁切最少的扇形角度 */
const fanAngles = computed(() => {
  if (!import.meta.client) return FAN_PRESETS[0]!.angles;

  const cx = pos.value.x + FAB_SIZE / 2;
  const onRight = cx >= window.innerWidth / 2;
  const onTop = pos.value.y + FAB_SIZE / 2 < window.innerHeight / 2;

  // 吸附侧优先：右侧偏左上，左侧偏右上
  const preference = onRight
    ? onTop
      ? [
          "down-left",
          "left",
          "down",
          "up-left",
          "up",
          "down-right",
          "right",
          "up-right",
        ]
      : [
          "up-left",
          "left",
          "up",
          "down-left",
          "down",
          "up-right",
          "right",
          "down-right",
        ]
    : onTop
      ? [
          "down-right",
          "right",
          "down",
          "up-right",
          "up",
          "down-left",
          "left",
          "up-left",
        ]
      : [
          "up-right",
          "right",
          "up",
          "down-right",
          "down",
          "up-left",
          "left",
          "down-left",
        ];

  let best = FAN_PRESETS[0]!;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const key of preference) {
    const preset = FAN_PRESETS.find((p) => p.key === key);
    if (!preset) continue;
    const score = measureFanOverflow(preset.angles);
    if (score === 0) return preset.angles;
    if (score < bestScore) {
      bestScore = score;
      best = preset;
    }
  }

  return best.angles;
});

/** AI 面板相对主圆的定位与尺寸 */
const panelStyle = computed(() => {
  if (!import.meta.client) {
    return { width: `${PANEL_IDEAL_W}px`, height: `${PANEL_IDEAL_H}px` };
  }

  const margin = getEdgeMargin();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fabLeft = pos.value.x;
  const fabTop = pos.value.y;
  const fabRight = fabLeft + FAB_SIZE;
  const fabBottom = fabTop + FAB_SIZE;

  const pw = Math.min(PANEL_IDEAL_W, Math.max(260, vw - margin * 2));
  const spaceAbove = fabTop - margin;
  const spaceBelow = vh - fabBottom - margin;

  let ph = Math.min(PANEL_IDEAL_H, vh - margin * 2);
  let absTop = margin;
  let absLeft = margin;

  const canAbove = spaceAbove >= PANEL_MIN_H + PANEL_GAP;
  const canBelow = spaceBelow >= PANEL_MIN_H + PANEL_GAP;

  if (canAbove && (spaceAbove >= spaceBelow || !canBelow)) {
    ph = Math.min(PANEL_IDEAL_H, spaceAbove - PANEL_GAP);
    absTop = fabTop - PANEL_GAP - ph;
  } else if (canBelow) {
    ph = Math.min(PANEL_IDEAL_H, spaceBelow - PANEL_GAP);
    absTop = fabBottom + PANEL_GAP;
  } else {
    ph = Math.min(PANEL_IDEAL_H, vh - margin * 2);
    absTop = Math.max(margin, Math.min((vh - ph) / 2, vh - margin - ph));
  }

  const preferLeft = fabLeft + FAB_SIZE / 2 > vw / 2;
  absLeft = preferLeft ? fabRight - pw : fabLeft;
  absLeft = Math.max(margin, Math.min(absLeft, vw - margin - pw));
  absTop = Math.max(margin, Math.min(absTop, vh - margin - ph));

  return {
    width: `${pw}px`,
    height: `${ph}px`,
    left: `${absLeft - fabLeft}px`,
    top: `${absTop - fabTop}px`,
    right: "auto",
    bottom: "auto",
  };
});

/** 子圆用 left/top 定位，避免与入场 transform 动画冲突 */
function orbStyle(index: number) {
  const angles = fanAngles.value;
  const deg = angles[index] ?? -90;
  const rad = (deg * Math.PI) / 180;
  const fabCenter = FAB_SIZE / 2;
  const orbHalf = ORB_SIZE / 2;
  const left = fabCenter + Math.cos(rad) * ORB_RADIUS - orbHalf;
  const top = fabCenter + Math.sin(rad) * ORB_RADIUS - orbHalf;
  return {
    left: `${left}px`,
    top: `${top}px`,
    transitionDelay: `${index * 45}ms`,
  };
}

/** 计算边缘安全边距 */
function getEdgeMargin() {
  return window.innerWidth <= 640 ? 12 : 20;
}

/** 限制浮钮不超出视口 */
function clampPosition(x: number, y: number) {
  const margin = 0;
  const maxX = Math.max(0, window.innerWidth - FAB_SIZE - margin);
  const maxY = Math.max(0, window.innerHeight - FAB_SIZE - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY),
  };
}

/** 吸附到最近左右侧边 */
function snapToEdge(y = pos.value.y) {
  const margin = getEdgeMargin();
  const centerX = pos.value.x + FAB_SIZE / 2;
  const snapX =
    centerX < window.innerWidth / 2
      ? margin
      : window.innerWidth - FAB_SIZE - margin;
  const maxY = Math.max(margin, window.innerHeight - FAB_SIZE - margin);
  const snapY = Math.min(Math.max(margin, y), maxY);
  pos.value = { x: snapX, y: snapY };
}

/** 初始化右下角并吸附 */
function initPosition() {
  const margin = getEdgeMargin();
  pos.value = {
    x: window.innerWidth - FAB_SIZE - margin,
    y: window.innerHeight - FAB_SIZE - margin,
  };
}

/** 开始拖拽 */
function startDrag(e: PointerEvent, _source: DragSource) {
  if (e.button !== 0) return;
  isDragging.value = true;
  hasMoved.value = false;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.originX = pos.value.x;
  dragState.originY = pos.value.y;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

/** 拖拽中更新坐标 */
function onDrag(e: PointerEvent) {
  if (!isDragging.value) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.value = true;
  pos.value = clampPosition(dragState.originX + dx, dragState.originY + dy);
}

/** 结束拖拽：移动则侧边吸附，否则触发主圆点击 */
function endDrag(e: PointerEvent, source: DragSource) {
  if (!isDragging.value) return;
  const moved = hasMoved.value;
  isDragging.value = false;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    /* 已释放 */
  }

  if (moved) {
    snapToEdge(pos.value.y);
    return;
  }
  if (source === "fab") onFabClick();
}

/** 主圆点击：关面板 / 开关菜单 */
function onFabClick() {
  if (chatOpen.value) {
    chatOpen.value = false;
    return;
  }
  menuOpen.value = !menuOpen.value;
}

/** 子圆点击分发操作 */
function onOrbClick(key: OrbKey) {
  menuOpen.value = false;
  if (key === "error") {
    triggerError();
    return;
  }
  if (key === "agent") {
    pageAgent.toggle();
    return;
  }
  if (key === "ai") {
    chatOpen.value = true;
  }
}

/** 触发 Sentry 测试错误 */
function triggerError() {
  const pageUrl = window.location.href;
  const message = `FUCK BUG!!!! [${pageUrl}]`;
  ElMessage.error(message);
  throw new Error(message);
}

/** 发送 AI 消息 */
async function handleSend(text?: string) {
  const query = text || inputText.value;
  if (!query.trim() || isStreaming.value) return;
  inputText.value = "";
  await sendMessage(query);
  await nextTick();
  scrollToBottom();
}

/** 滚动消息列表到底部 */
function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
}

/** 窗口尺寸变化时校正并重新吸附 */
function onWindowResize() {
  pos.value = clampPosition(pos.value.x, pos.value.y);
  if (!isDragging.value) snapToEdge(pos.value.y);
}

watch(
  messages,
  () => {
    nextTick(() => scrollToBottom());
  },
  { deep: true },
);

/** 幽灵手启动时收起 AI 面板与菜单 */
watch(ghostBusy, (busy) => {
  if (busy) {
    chatOpen.value = false;
    menuOpen.value = false;
  }
});

onMounted(() => {
  nextTick(initPosition);
  window.addEventListener("resize", onWindowResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
});
</script>

<style scoped lang="scss">
.tool-hub {
  position: fixed;
  z-index: 1100;
  width: 56px;
  height: 56px;
  touch-action: none;
  font-family: var(--void-display);

  &--snap {
    transition:
      left 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      top 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &--dragging {
    transition: none;

    .tool-hub__fab {
      cursor: grabbing;
      transform: none;
    }
  }
}

.tool-hub__fab {
  position: relative;
  z-index: 2;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid var(--void-border);
  background: rgba(8, 8, 12, 0.92);
  color: var(--void-text);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(16px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    background 0.2s,
    border-color 0.2s,
    color 0.2s;

  &:hover {
    transform: scale(1.06);
    border-color: var(--void-border-hover);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.55);
  }

  &--active {
    background: #fff;
    color: #000;
    border-color: #fff;
  }
}

.tool-hub__orb {
  position: absolute;
  z-index: 1;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--void-border);
  background: rgba(8, 8, 12, 0.92);
  color: var(--void-text);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transform-origin: center center;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s,
    box-shadow 0.2s,
    left 0.22s ease,
    top 0.22s ease,
    opacity 0.22s ease,
    transform 0.22s ease;

  &:hover {
    border-color: var(--void-border-hover);
    background: rgba(255, 255, 255, 0.1);
  }

  &--active {
    background: #fff;
    color: #000;
    border-color: #fff;
  }

  &--error {
    color: #ff9a9a;
    border-color: rgba(255, 120, 120, 0.35);

    &:hover {
      background: rgba(255, 120, 120, 0.15);
      border-color: rgba(255, 120, 120, 0.55);
      color: #ffc4c4;
    }
  }
}

.tool-hub__orb-label {
  font-family: var(--void-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
  line-height: 1;
}

.orb-enter-active,
.orb-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    left 0.22s ease,
    top 0.22s ease;
}

.orb-enter-from,
.orb-leave-to {
  opacity: 0;
  transform: scale(0.35);
}

.tool-hub__panel {
  position: absolute;
  z-index: 3;
  background: rgba(8, 8, 12, 0.94);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(24px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.tool-hub__panel-header {
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
  flex-shrink: 0;

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

.tool-hub__panel-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tool-hub__panel-icon {
  color: var(--void-muted);
}

.tool-hub__clear {
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--void-muted);
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--void-border-hover);
  border-radius: 100px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--void-text);
    border-color: var(--void-border-hover);
  }
}

.tool-hub__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.tool-hub__welcome {
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

.tool-hub__prompts {
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

.tool-hub__msg {
  display: flex;
  margin-bottom: 12px;

  &.user {
    justify-content: flex-end;

    .tool-hub__bubble {
      background: #fff;
      color: #000;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    justify-content: flex-start;

    .tool-hub__bubble {
      background: rgba(255, 255, 255, 0.06);
      color: var(--void-text);
      border: 1px solid var(--void-border);
      border-radius: 16px 16px 16px 4px;
    }
  }
}

.tool-hub__bubble {
  max-width: 85%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.tool-hub__typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    background: var(--void-muted);
    border-radius: 50%;
    animation: tool-hub-bounce 1.2s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes tool-hub-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.tool-hub__action {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--void-border);
  border-radius: var(--void-radius-sm);

  pre {
    font-family: var(--void-mono);
    font-size: 11px;
    color: var(--void-text);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }
}

.tool-hub__action-label {
  font-family: var(--void-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--void-muted);
  margin-bottom: 6px;
}

.tool-hub__action-status {
  font-size: 12px;
  color: var(--void-text);
  font-weight: 500;
  margin-top: 8px;
}

.tool-hub__thinking {
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

.tool-hub__input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--void-border);
  background: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;

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

.tool-hub__send {
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
  transition:
    box-shadow 0.2s,
    opacity 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
