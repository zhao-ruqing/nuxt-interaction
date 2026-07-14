/**
 * VOID 沉浸式页面公共逻辑（非首页）
 * 用法：在 VoidShell 中调用；不启用自定义光标
 */
import { gsap } from "gsap";

export function useVoidPage() {
  const isMobile = ref(true);

  let magneticCleanups: (() => void)[] = [];

  /** 检测是否为移动端或触摸设备 */
  function detectMobile() {
    isMobile.value = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  }

  /** 为 data-magnetic 元素绑定磁力吸附 */
  function bindMagnetic(root?: HTMLElement | Document) {
    const scope = root ?? document;
    scope.querySelectorAll("[data-magnetic]").forEach((el) => {
      const node = el as HTMLElement;
      const onLeave = () => {
        gsap.to(node, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      };
      const onMove = (e: MouseEvent) => {
        const rect = node.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(node, { x: x * 0.22, y: y * 0.22, duration: 0.35, ease: "power2.out" });
      };
      node.addEventListener("mouseleave", onLeave);
      node.addEventListener("mousemove", onMove);
      magneticCleanups.push(() => {
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
  }

  /** 卸载 VOID 页面副作用 */
  function unmountVoidPage() {
    magneticCleanups.forEach((fn) => fn());
    magneticCleanups = [];
    document.body.classList.remove("void-body", "void-body--mobile");
  }

  onMounted(mountVoidPage);
  onUnmounted(unmountVoidPage);

  return {
    isMobile,
    bindMagnetic,
    detectMobile,
  };
}
