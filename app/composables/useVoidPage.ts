/**
 * VOID 沉浸式页面公共逻辑
 * 用法：在页面中调用 useVoidPage()，根节点绑定 @mousemove 与 class
 */
import { gsap } from "gsap";

export function useVoidPage() {
  const isMobile = ref(true);
  const cursorHover = ref(false);
  const cursorDot = ref({ x: 0, y: 0 });
  const cursorRing = ref({ x: 0, y: 0 });

  let rafId = 0;
  let magneticCleanups: (() => void)[] = [];

  const cursorDotStyle = computed(() => ({
    transform: `translate3d(${cursorDot.value.x}px, ${cursorDot.value.y}px, 0)`,
  }));

  const cursorRingStyle = computed(() => ({
    transform: `translate3d(${cursorRing.value.x}px, ${cursorRing.value.y}px, 0)`,
  }));

  /** 检测是否为移动端或触摸设备 */
  function detectMobile() {
    isMobile.value = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  }

  /** 光标缓动跟随循环 */
  function cursorLoop() {
    cursorRing.value.x += (cursorDot.value.x - cursorRing.value.x) * 0.12;
    cursorRing.value.y += (cursorDot.value.y - cursorRing.value.y) * 0.12;
    rafId = requestAnimationFrame(cursorLoop);
  }

  /** 记录鼠标坐标 */
  function onMouseMove(e: MouseEvent) {
    cursorDot.value = { x: e.clientX, y: e.clientY };
  }

  /** 为 data-magnetic 元素绑定磁力吸附 */
  function bindMagnetic(root?: HTMLElement | Document) {
    const scope = root ?? document;
    scope.querySelectorAll("[data-magnetic]").forEach((el) => {
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
        gsap.to(node, { x: x * 0.22, y: y * 0.22, duration: 0.35, ease: "power2.out" });
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

  /** 挂载 VOID 页面副作用 */
  function mountVoidPage() {
    detectMobile();
    document.body.classList.add("void-body");
    if (isMobile.value) document.body.classList.add("void-body--mobile");
    if (!isMobile.value) cursorLoop();
  }

  /** 卸载 VOID 页面副作用 */
  function unmountVoidPage() {
    cancelAnimationFrame(rafId);
    magneticCleanups.forEach((fn) => fn());
    magneticCleanups = [];
    document.body.classList.remove("void-body", "void-body--mobile");
  }

  onMounted(mountVoidPage);
  onUnmounted(unmountVoidPage);

  return {
    isMobile,
    cursorHover,
    cursorDotStyle,
    cursorRingStyle,
    onMouseMove,
    bindMagnetic,
    detectMobile,
  };
}
