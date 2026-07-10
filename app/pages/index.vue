<template>
  <div
    class="void"
    :class="{ 'void--ready': isReady, 'void--mobile': isMobile }"
    @mousemove="onMouseMove"
  >
    <!-- 加载遮罩 -->
    <div class="void-preloader" :class="{ 'void-preloader--hide': isReady }">
      <div class="void-preloader__bar">
        <div class="void-preloader__fill" :style="{ width: loadProgress + '%' }" />
      </div>
      <span class="void-preloader__label">{{ loadProgress }}%</span>
    </div>

    <!-- 自定义光标：圆环与圆点为同级节点，避免 transform 层叠导致偏移 -->
    <template v-if="!isMobile">
      <div class="void-cursor__ring" :class="{ 'void-cursor__ring--hover': cursorHover }" :style="cursorRingStyle" />
      <div class="void-cursor__dot" :style="cursorDotStyle" />
    </template>

    <!-- 粒子画布 -->
    <canvas ref="canvasRef" class="void-canvas" />

    <!-- 噪点与扫描线 -->
    <div class="void-noise" />
    <div class="void-scanlines" />

    <!-- 透视网格 -->
    <div class="void-grid" ref="gridRef" />

    <!-- 顶栏 -->
    <header class="void-nav" ref="navRef">
      <NuxtLink to="/" class="void-nav__logo">VOID</NuxtLink>
      <nav class="void-nav__links">
        <a href="#matrix" class="void-nav__link" data-magnetic>矩阵</a>
        <a href="#signal" class="void-nav__link" data-magnetic>信号</a>
        <NuxtLink to="/products" class="void-nav__link" data-magnetic>商城</NuxtLink>
        <NuxtLink to="/auth/login" class="void-nav__cta" data-magnetic>进入</NuxtLink>
      </nav>
    </header>

    <!-- Hero -->
    <section class="void-hero" ref="heroRef">
      <div class="void-hero__badge" ref="badgeRef">
        <span class="void-hero__pulse" />
        SYSTEM ONLINE
      </div>

      <h1 class="void-hero__title" ref="titleRef">
        <span
          v-for="(char, i) in titleChars"
          :key="'t' + i"
          class="void-hero__char"
          :class="{ 'void-hero__char--space': char === ' ' }"
        >{{ char === " " ? "\u00A0" : char }}</span>
      </h1>

      <p class="void-hero__sub" ref="subRef">
        穿越维度的沉浸式交互体验 · 打破屏幕边界
      </p>

      <div class="void-hero__actions" ref="actionsRef">
        <button class="void-btn void-btn--primary" data-magnetic @click="scrollTo('#matrix')">
          <span class="void-btn__text">探索矩阵</span>
          <span class="void-btn__glow" />
        </button>
        <button class="void-btn void-btn--ghost" data-magnetic @click="scrollTo('#signal')">
          接收信号
        </button>
      </div>

      <div class="void-hero__scroll" ref="scrollHintRef">
        <span>SCROLL</span>
        <div class="void-hero__scroll-line" />
      </div>
    </section>

    <!-- 无限滚动字幕 -->
    <div class="void-marquee" ref="marqueeRef">
      <div class="void-marquee__track">
        <span v-for="n in 2" :key="n" class="void-marquee__content">
          <span v-for="(word, i) in marqueeWords" :key="n + '-' + i" class="void-marquee__word">
            {{ word }}
            <span class="void-marquee__dot">◆</span>
          </span>
        </span>
      </div>
    </div>

    <!-- 横向滚动矩阵 -->
    <section id="matrix" class="void-matrix" ref="matrixRef">
      <div class="void-matrix__sticky">
        <div class="void-matrix__header">
          <span class="void-matrix__index">01</span>
          <h2 class="void-matrix__title">能力矩阵</h2>
          <p class="void-matrix__desc">横向穿越 · 每一帧都是独立宇宙</p>
        </div>
        <div class="void-matrix__track" ref="matrixTrackRef">
          <article
            v-for="(panel, i) in matrixPanels"
            :key="i"
            class="void-panel"
            :ref="(el) => setPanelRef(el, i)"
          >
            <div class="void-panel__glow" />
            <span class="void-panel__num">{{ String(i + 1).padStart(2, "0") }}</span>
            <h3 class="void-panel__name">{{ panel.title }}</h3>
            <p class="void-panel__text">{{ panel.desc }}</p>
            <div class="void-panel__visual">
              <div
                v-for="(bar, j) in panel.bars"
                :key="j"
                class="void-panel__bar"
                :style="{ '--h': bar + '%', '--d': j * 0.08 + 's' }"
              />
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 信号网格 -->
    <section id="signal" class="void-signal" ref="signalRef">
      <div class="void-signal__header" ref="signalHeaderRef">
        <span class="void-matrix__index">02</span>
        <h2 class="void-signal__title">信号捕获</h2>
      </div>
      <div class="void-bento">
        <div
          v-for="(item, i) in bentoItems"
          :key="i"
          class="void-bento__cell"
          :class="'void-bento__cell--' + item.size"
          :ref="(el) => setBentoRef(el, i)"
        >
          <div class="void-bento__border" />
          <span class="void-bento__tag">{{ item.tag }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
          <div class="void-bento__metric">{{ item.metric }}</div>
        </div>
      </div>
    </section>

    <!-- 数据流 -->
    <section class="void-stats" ref="statsRef">
      <div
        v-for="(stat, i) in stats"
        :key="i"
        class="void-stat"
        :ref="(el) => setStatRef(el, i)"
      >
        <div class="void-stat__value">
          <span class="void-stat__num">{{ statValues[i] }}</span>
          <span class="void-stat__unit">{{ stat.unit }}</span>
        </div>
        <span class="void-stat__label">{{ stat.label }}</span>
      </div>
    </section>

    <!-- 终幕 CTA -->
    <section class="void-finale" ref="finaleRef">
      <div class="void-finale__ring void-finale__ring--1" />
      <div class="void-finale__ring void-finale__ring--2" />
      <div class="void-finale__ring void-finale__ring--3" />
      <h2 class="void-finale__title" ref="finaleTitleRef">准备好跃迁了吗</h2>
      <p class="void-finale__sub" ref="finaleSubRef">踏入未知维度，从此刻开始</p>
      <NuxtLink to="/auth/register" class="void-btn void-btn--primary void-btn--xl" data-magnetic>
        <span class="void-btn__text">启动跃迁</span>
        <span class="void-btn__glow" />
      </NuxtLink>
    </section>

    <footer class="void-footer">
      <span>© {{ year }} VOID EXPERIENCE</span>
      <div class="void-footer__links">
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/products">商城</NuxtLink>
        <NuxtLink to="/auth/login">登录</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

definePageMeta({ layout: false });

useHead({
  title: "VOID — 沉浸式交互体验",
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
    },
  ],
});

const year = new Date().getFullYear();
const titleText = "边界之外";
const titleChars = titleText.split("");
const marqueeWords = ["IMMERSION", "INTERACTION", "INFINITE", "VOID", "BEYOND", "SIGNAL", "MATRIX"];

const matrixPanels = [
  { title: "粒子场", desc: "数千光点编织成交互网络，随指尖流动重组", bars: [40, 72, 55, 88, 63, 45, 78, 52] },
  { title: "时空折跃", desc: "滚动驱动的时间轴，将二维页面折叠成多维空间", bars: [65, 48, 90, 35, 70, 58, 82, 44] },
  { title: "磁力感应", desc: "元素感知光标磁场，悬停时产生引力扭曲", bars: [55, 80, 42, 68, 75, 50, 92, 38] },
  { title: "信号共振", desc: "数据脉冲以视觉频率震荡，形成可感知的节奏", bars: [78, 52, 66, 84, 47, 73, 60, 95] },
];

const bentoItems = [
  { size: "lg", tag: "CORE", title: "深度沉浸", desc: "全屏暗场环境，剥离一切干扰，只留下纯粹交互", metric: "99.7% 专注度" },
  { size: "sm", tag: "LATENCY", title: "零延迟", desc: "帧级响应", metric: "< 16ms" },
  { size: "sm", tag: "NODES", title: "节点网络", desc: "实时拓扑", metric: "2,048+" },
  { size: "md", tag: "WAVE", title: "波形引擎", desc: "正弦叠加驱动的视觉振荡系统", metric: "60 FPS" },
  { size: "md", tag: "DEPTH", title: "纵深视差", desc: "多层景深错位，制造立体空间幻觉", metric: "7 层" },
];

const stats = [
  { target: 128, unit: "K", label: "粒子节点" },
  { target: 60, unit: "FPS", label: "渲染帧率" },
  { target: 7, unit: "维", label: "交互层级" },
  { target: 100, unit: "%", label: "沉浸指数" },
];

// DOM refs
const canvasRef = ref<HTMLCanvasElement>();
const gridRef = ref<HTMLElement>();
const navRef = ref<HTMLElement>();
const heroRef = ref<HTMLElement>();
const badgeRef = ref<HTMLElement>();
const titleRef = ref<HTMLElement>();
const subRef = ref<HTMLElement>();
const actionsRef = ref<HTMLElement>();
const scrollHintRef = ref<HTMLElement>();
const marqueeRef = ref<HTMLElement>();
const matrixRef = ref<HTMLElement>();
const matrixTrackRef = ref<HTMLElement>();
const signalRef = ref<HTMLElement>();
const signalHeaderRef = ref<HTMLElement>();
const statsRef = ref<HTMLElement>();
const finaleRef = ref<HTMLElement>();
const finaleTitleRef = ref<HTMLElement>();
const finaleSubRef = ref<HTMLElement>();

const panelRefs = ref<HTMLElement[]>([]);
const bentoRefs = ref<HTMLElement[]>([]);
const statRefs = ref<HTMLElement[]>([]);

// 状态
const isReady = ref(false);
const loadProgress = ref(0);
const isMobile = ref(true);
const cursorHover = ref(false);
const cursorDot = ref({ x: 0, y: 0 });
const cursorRing = ref({ x: 0, y: 0 });
const statValues = ref(stats.map(() => "0"));

let rafId = 0;
let particleRafId = 0;
let scrollTriggers: ScrollTrigger[] = [];
let magneticCleanups: (() => void)[] = [];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

let particles: Particle[] = [];
let mouse = { x: -9999, y: -9999 };
let ctx: CanvasRenderingContext2D | null = null;
let canvasW = 0;
let canvasH = 0;

const cursorDotStyle = computed(() => ({
  transform: `translate3d(${cursorDot.value.x}px, ${cursorDot.value.y}px, 0)`,
}));

const cursorRingStyle = computed(() => ({
  transform: `translate3d(${cursorRing.value.x}px, ${cursorRing.value.y}px, 0)`,
}));

/** 收集横向面板 DOM 引用 */
function setPanelRef(el: unknown, i: number) {
  if (el) panelRefs.value[i] = el as HTMLElement;
}

/** 收集 Bento 网格 DOM 引用 */
function setBentoRef(el: unknown, i: number) {
  if (el) bentoRefs.value[i] = el as HTMLElement;
}

/** 收集统计项 DOM 引用 */
function setStatRef(el: unknown, i: number) {
  if (el) statRefs.value[i] = el as HTMLElement;
}

/** 平滑滚动到锚点 */
function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
}

/** 检测是否为触摸设备 */
function detectMobile() {
  isMobile.value = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
}

/** 模拟加载进度 */
function runPreloader() {
  return new Promise<void>((resolve) => {
    const tick = () => {
      loadProgress.value = Math.min(100, loadProgress.value + Math.random() * 18 + 4);
      if (loadProgress.value >= 100) {
        loadProgress.value = 100;
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/** 初始化粒子系统 */
function initParticles() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resizeCanvas();
  const count = isMobile.value ? 60 : 140;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    size: Math.random() * 1.8 + 0.4,
  }));
}

/** 调整画布尺寸 */
function resizeCanvas() {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  canvasW = window.innerWidth;
  canvasH = window.innerHeight;
  const dpr = devicePixelRatio;
  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = canvasW + "px";
  canvas.style.height = canvasH + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** 绘制粒子网络帧 */
function drawParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvasW) p.vx *= -1;
    if (p.y < 0 || p.y > canvasH) p.vy *= -1;

    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 140 && dist > 0) {
      p.x -= (dx / dist) * 0.8;
      p.y -= (dy / dist) * 0.8;
    }
  }

  const linkDist = isMobile.value ? 100 : 130;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]!;
      const b = particles[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < linkDist) {
        const alpha = (1 - d / linkDist) * 0.35;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  particleRafId = requestAnimationFrame(drawParticles);
}

/** 光标跟随动画循环 */
function cursorLoop() {
  cursorRing.value.x += (cursorDot.value.x - cursorRing.value.x) * 0.12;
  cursorRing.value.y += (cursorDot.value.y - cursorRing.value.y) * 0.12;
  rafId = requestAnimationFrame(cursorLoop);
}

/** 全局鼠标移动处理 */
function onMouseMove(e: MouseEvent) {
  cursorDot.value = { x: e.clientX, y: e.clientY };
  mouse = { x: e.clientX, y: e.clientY };
}

/** 窗口尺寸变化时重绘画布 */
function onResize() {
  detectMobile();
  resizeCanvas();
}

/** 为带 data-magnetic 的元素绑定磁力效果 */
function bindMagnetic() {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const node = el as HTMLElement;
    const onEnter = () => { cursorHover.value = true; };
    const onLeave = () => {
      cursorHover.value = false;
      gsap.to(node, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    };
    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(node, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: "power2.out" });
    };
    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);
    node.addEventListener("mousemove", onMove);
    magneticCleanups.push(() => {
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mouseleave", onLeave);
      node.removeEventListener("mousemove", onMove);
    });
  });
}

/** 初始化 GSAP 滚动与入场动画 */
function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  const badge = badgeRef.value;
  const sub = subRef.value;
  const actions = actionsRef.value;
  const scrollHint = scrollHintRef.value;
  const grid = gridRef.value;
  const nav = navRef.value;
  const signalHeader = signalHeaderRef.value;
  const signal = signalRef.value;
  const statsEl = statsRef.value;
  const finale = finaleRef.value;
  const finaleTitle = finaleTitleRef.value;
  const finaleSub = finaleSubRef.value;
  const chars = titleRef.value?.querySelectorAll(".void-hero__char");

  if (!badge || !sub || !actions || !scrollHint || !grid || !nav || !chars?.length) return;

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.fromTo(badge, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
    .fromTo(chars, { y: 80, opacity: 0, rotateX: -40 }, {
      y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.06,
    }, "-=0.4")
    .fromTo(sub, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.5")
    .fromTo(actions, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.4")
    .fromTo(scrollHint, { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.2");

  gsap.to(scrollHint, {
    y: 12,
    repeat: -1,
    yoyo: true,
    duration: 1.4,
    ease: "sine.inOut",
  });

  gsap.to(grid, {
    backgroundPosition: "0px 80px",
    ease: "none",
    scrollTrigger: {
      trigger: ".void-hero",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });

  gsap.to(nav, {
    y: 0,
    opacity: 1,
    duration: 1,
    delay: 0.3,
    ease: "power3.out",
  });

  // 横向滚动矩阵
  const track = matrixTrackRef.value;
  const panels = panelRefs.value.filter(Boolean);
  if (track && panels.length) {
    const getScroll = () => track.scrollWidth - window.innerWidth + 120;
    const st = gsap.to(track, {
      x: () => -getScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: matrixRef.value,
        start: "top top",
        end: () => "+=" + getScroll(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    scrollTriggers.push(st.scrollTrigger!);

    panels.forEach((panel, i) => {
      gsap.fromTo(panel, { scale: 0.92, opacity: 0.3 }, {
        scale: 1,
        opacity: 1,
        scrollTrigger: {
          trigger: matrixRef.value,
          start: () => "top+=" + (i * (getScroll() / panels.length)) + " top",
          end: () => "top+=" + ((i + 1) * (getScroll() / panels.length)) + " top",
          scrub: true,
        },
      });
    });
  }

  if (signalHeader && signal) {
    gsap.fromTo(signalHeader, { x: -60, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.8,
      scrollTrigger: { trigger: signal, start: "top 80%" },
    });
  }

  bentoRefs.value.forEach((cell, i) => {
    if (!cell) return;
    gsap.fromTo(cell, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.7, delay: i * 0.08,
      scrollTrigger: { trigger: cell, start: "top 90%" },
    });
  });

  statRefs.value.forEach((el, i) => {
    if (!el || !statsEl) return;
    const stat = stats[i];
    if (!stat) return;
    const target = stat.target;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: { trigger: statsEl, start: "top 80%" },
      onUpdate: () => {
        statValues.value[i] = Math.round(obj.val).toString();
      },
    });
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.6, delay: i * 0.1,
      scrollTrigger: { trigger: statsEl, start: "top 85%" },
    });
  });

  if (finale && finaleTitle && finaleSub) {
    const finaleTl = gsap.timeline({
      scrollTrigger: { trigger: finale, start: "top 75%" },
    });
    finaleTl
      .fromTo(finaleTitle, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo(finaleSub, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4");
  }

  gsap.to(".void-finale__ring--1", {
    rotate: 360,
    duration: 20,
    repeat: -1,
    ease: "none",
  });
  gsap.to(".void-finale__ring--2", {
    rotate: -360,
    duration: 28,
    repeat: -1,
    ease: "none",
  });
}

/** 销毁所有动画与监听 */
function cleanup() {
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(particleRafId);
  scrollTriggers.forEach((st) => st.kill());
  ScrollTrigger.getAll().forEach((st) => st.kill());
  magneticCleanups.forEach((fn) => fn());
  window.removeEventListener("resize", onResize);
  document.body.classList.remove("void-body");
}

onMounted(async () => {
  detectMobile();
  document.body.classList.add("void-body");
  await runPreloader();
  isReady.value = true;

  initParticles();
  drawParticles();
  if (!isMobile.value) cursorLoop();
  bindMagnetic();

  await nextTick();
  initAnimations();
  window.addEventListener("resize", onResize);
});

onUnmounted(cleanup);
</script>

<style scoped lang="scss">
// ===== 沉浸式暗场首页 =====

.void {
  --void-bg: #030306;
  --void-surface: rgba(255, 255, 255, 0.03);
  --void-border: rgba(255, 255, 255, 0.08);
  --void-text: #f2f2f2;
  --void-muted: rgba(255, 255, 255, 0.42);
  --void-mono: "JetBrains Mono", monospace;
  --void-display: "Syne", system-ui, sans-serif;

  position: relative;
  min-height: 100vh;
  background: var(--void-bg);
  color: var(--void-text);
  font-family: var(--void-display);
  overflow-x: hidden;
  cursor: none;

  &--mobile {
    cursor: auto;
  }

  &--ready {
    .void-hero__char {
      text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
    }
  }
}

// 加载
.void-preloader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #000;
  transition: opacity 0.8s ease, visibility 0.8s ease;

  &--hide {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  &__bar {
    width: 200px;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: #fff;
    transition: width 0.1s linear;
  }

  &__label {
    font-family: var(--void-mono);
    font-size: 12px;
    letter-spacing: 0.2em;
    color: var(--void-muted);
  }
}

// 光标（difference 混合模式：深底变白、浅底变黑）
.void-cursor__dot,
.void-cursor__ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
  will-change: transform;
  mix-blend-mode: difference;
}

.void-cursor__dot {
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  background: #fff;
  border-radius: 50%;
}

.void-cursor__ring {
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border: 1px solid #fff;
  border-radius: 50%;
  transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease;

  &--hover {
    width: 56px;
    height: 56px;
    margin: -28px 0 0 -28px;
  }
}

// 背景层
.void-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.void-noise {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.void-scanlines {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
}

.void-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
  transform: perspective(600px) rotateX(60deg) scale(2);
  transform-origin: center 80%;
  opacity: 0.5;
}

// 导航
.void-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 48px;
  opacity: 0;
  transform: translateY(-20px);

  &__logo {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.3em;
    color: var(--void-text);
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 36px;
  }

  &__link {
    font-size: 13px;
    letter-spacing: 0.12em;
    color: var(--void-muted);
    transition: color 0.3s;

    &:hover {
      color: var(--void-text);
    }
  }

  &__cta {
    padding: 10px 24px;
    border: 1px solid var(--void-border);
    border-radius: 100px;
    font-size: 13px;
    letter-spacing: 0.1em;
    transition: background 0.3s, border-color 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
}

// Hero
.void-hero {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
}

.void-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  margin-bottom: 40px;
  border: 1px solid var(--void-border);
  border-radius: 100px;
  font-family: var(--void-mono);
  font-size: 11px;
  letter-spacing: 0.25em;
  color: var(--void-muted);
}

.void-hero__pulse {
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
  50% { opacity: 0.6; box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
}

.void-hero__title {
  font-size: clamp(56px, 12vw, 140px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 32px;
  perspective: 800px;
}

.void-hero__char {
  display: inline-block;
  color: var(--void-text);
  transform-origin: center bottom;

  &--space {
    width: 0.3em;
  }
}

.void-hero__sub {
  max-width: 520px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--void-muted);
  margin-bottom: 48px;
}

.void-hero__actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.void-hero__scroll {
  position: absolute;
  bottom: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: var(--void-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--void-muted);
}

.void-hero__scroll-line {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), transparent);
}

// 按钮
.void-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 36px;
  border: none;
  border-radius: 100px;
  font-family: var(--void-display);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: none;
  overflow: hidden;
  transition: box-shadow 0.4s;

  &--primary {
    background: #fff;
    color: #000;

    &:hover {
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.25);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--void-text);
    border: 1px solid var(--void-border);

    &:hover {
      border-color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.04);
    }
  }

  &--xl {
    padding: 20px 52px;
    font-size: 16px;
  }

  &__glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.3), transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover &__glow {
    opacity: 1;
  }
}

.void--mobile .void-btn {
  cursor: pointer;
}

// 跑马灯
.void-marquee {
  position: relative;
  z-index: 2;
  padding: 32px 0;
  border-top: 1px solid var(--void-border);
  border-bottom: 1px solid var(--void-border);
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
}

.void-marquee__track {
  display: flex;
  width: max-content;
  animation: marquee 30s linear infinite;
}

.void-marquee__content {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.void-marquee__word {
  display: inline-flex;
  align-items: center;
  gap: 32px;
  padding: 0 32px;
  font-size: clamp(32px, 5vw, 64px);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.08);
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
}

.void-marquee__dot {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

// 横向矩阵
.void-matrix {
  position: relative;
  z-index: 2;
  height: 100vh;

  &__sticky {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  &__header {
    padding: 0 48px 40px;
  }

  &__index {
    font-family: var(--void-mono);
    font-size: 12px;
    letter-spacing: 0.2em;
    color: var(--void-muted);
  }

  &__title {
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    margin: 12px 0;
    color: var(--void-text);
  }

  &__desc {
    font-size: 16px;
    color: var(--void-muted);
  }

  &__track {
    display: flex;
    gap: 32px;
    padding: 0 48px 48px;
    will-change: transform;
  }
}

.void-panel {
  position: relative;
  flex: 0 0 min(420px, 80vw);
  height: 420px;
  padding: 40px;
  background: var(--void-surface);
  border: 1px solid var(--void-border);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  transition: border-color 0.4s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.18);

    .void-panel__glow {
      opacity: 1;
    }
  }

  &__glow {
    position: absolute;
    inset: -1px;
    border-radius: 24px;
    background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.06), transparent 40%);
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }

  &__num {
    font-family: var(--void-mono);
    font-size: 13px;
    color: var(--void-muted);
    letter-spacing: 0.15em;
  }

  &__name {
    font-size: 32px;
    font-weight: 800;
    margin: 16px 0 12px;
    color: var(--void-text);
  }

  &__text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--void-muted);
    margin-bottom: 32px;
  }

  &__visual {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 100px;
  }

  &__bar {
    flex: 1;
    height: var(--h);
    background: rgba(255, 255, 255, 0.12);
    border-radius: 4px 4px 0 0;
    animation: barPulse 2s ease-in-out infinite;
    animation-delay: var(--d);
  }
}

@keyframes barPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

// 信号区
.void-signal {
  position: relative;
  z-index: 2;
  padding: 120px 48px;
}

.void-signal__title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  margin-top: 12px;
  color: var(--void-text);
}

.void-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
  margin-top: 56px;

  &__cell {
    position: relative;
    padding: 28px;
    background: var(--void-surface);
    border-radius: 20px;
    overflow: hidden;
    transition: transform 0.4s ease;

    &:hover {
      transform: translateY(-4px);

      .void-bento__border {
        opacity: 1;
      }
    }

    &--lg {
      grid-column: span 2;
      grid-row: span 2;
    }

    &--md {
      grid-column: span 2;
    }

    h3 {
      font-size: 22px;
      font-weight: 700;
      margin: 12px 0 8px;
      color: var(--void-text);
    }

    p {
      font-size: 13px;
      line-height: 1.6;
      color: var(--void-muted);
    }
  }

  &__border {
    position: absolute;
    inset: 0;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    opacity: 0;
    transition: opacity 0.4s;
    pointer-events: none;
  }

  &__tag {
    font-family: var(--void-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: var(--void-muted);
  }

  &__metric {
    position: absolute;
    bottom: 28px;
    right: 28px;
    font-family: var(--void-mono);
    font-size: 20px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }
}

// 统计
.void-stats {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin: 0 48px;
  padding: 80px 0;
  border-top: 1px solid var(--void-border);
  border-bottom: 1px solid var(--void-border);
  background: var(--void-border);
}

.void-stat {
  padding: 48px 32px;
  background: var(--void-bg);
  text-align: center;

  &__value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    margin-bottom: 12px;
  }

  &__num {
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 800;
    color: var(--void-text);
    font-variant-numeric: tabular-nums;
  }

  &__unit {
    font-family: var(--void-mono);
    font-size: 18px;
    color: var(--void-muted);
  }

  &__label {
    font-size: 13px;
    letter-spacing: 0.15em;
    color: var(--void-muted);
    text-transform: uppercase;
  }
}

// 终幕
.void-finale {
  position: relative;
  z-index: 2;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px;
  overflow: hidden;
}

.void-finale__ring {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  pointer-events: none;

  &--1 { width: 400px; height: 400px; }
  &--2 { width: 600px; height: 600px; border-style: dashed; }
  &--3 { width: 800px; height: 800px; opacity: 0.5; }
}

.void-finale__title {
  position: relative;
  font-size: clamp(40px, 8vw, 80px);
  font-weight: 800;
  margin-bottom: 20px;
  color: var(--void-text);
}

.void-finale__sub {
  position: relative;
  font-size: 17px;
  color: var(--void-muted);
  margin-bottom: 48px;
}

// 页脚
.void-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 48px;
  border-top: 1px solid var(--void-border);
  font-family: var(--void-mono);
  font-size: 12px;
  color: var(--void-muted);

  &__links {
    display: flex;
    gap: 24px;

    a:hover {
      color: var(--void-text);
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .void-bento {
    grid-template-columns: repeat(2, 1fr);

    &__cell--lg {
      grid-column: span 2;
    }
  }

  .void-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .void-nav {
    padding: 16px 20px;

    &__links {
      gap: 16px;
    }

    &__link {
      display: none;
    }
  }

  .void-matrix__header,
  .void-matrix__track {
    padding-left: 20px;
    padding-right: 20px;
  }

  .void-signal {
    padding: 80px 20px;
  }

  .void-bento {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;

    &__cell--lg,
    &__cell--md {
      grid-column: span 1;
      grid-row: span 1;
    }
  }

  .void-stats {
    margin: 0 20px;
    grid-template-columns: 1fr 1fr;
  }

  .void-footer {
    flex-direction: column;
    gap: 16px;
    padding: 24px 20px;
  }
}
</style>

<style lang="scss">
// 首页全屏时覆盖全局 body 样式
body.void-body {
  background: #030306;
  color: #f2f2f2;
  overflow-x: hidden;
  cursor: none;

  &,
  * {
    cursor: none !important;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #f2f2f2;
  }
}
</style>
