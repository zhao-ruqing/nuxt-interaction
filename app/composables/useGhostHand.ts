/** 幽灵手：虚拟光标移动并模拟点击。鼠标移动时自动中止以防止误操作。 */
export function useGhostHand() {
  const cursorEl = ref<HTMLElement | null>(null)
  const isActive = ref(false)
  const isAborted = ref(false)
  let mouseGuard: ((e: MouseEvent) => void) | null = null

  // ---- 鼠标守护：检测用户真实鼠标移动 ----

  function startMouseGuard() {
    if (mouseGuard) return
    isAborted.value = false
    mouseGuard = (e: MouseEvent) => {
      // 过滤掉 movementX/Y 均为 0 的伪事件（部分浏览器在页面加载/焦点变化时触发）
      if (e.movementX === 0 && e.movementY === 0) return
      isAborted.value = true
      hide()
      ElMessage.warning('检测到鼠标移动，幽灵手操作已取消')
      stopMouseGuard()
    }
    window.addEventListener('mousemove', mouseGuard)
  }

  function stopMouseGuard() {
    if (mouseGuard) {
      window.removeEventListener('mousemove', mouseGuard)
      mouseGuard = null
    }
  }

  /** 检查是否已被用户中止，中止时抛出异常让调用方停止后续操作 */
  function guard(): void {
    if (isAborted.value) {
      throw new Error('GHOST_ABORTED')
    }
  }

  // ---- 光标管理 ----

  function ensureCursor() {
    if (!import.meta.client) return null
    if (!cursorEl.value) {
      const el = document.createElement('div')
      el.className = 'ghost-hand-cursor'
      el.textContent = '👆'
      document.body.appendChild(el)
      cursorEl.value = el
    }
    return cursorEl.value
  }

  function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ---- 基础移动/点击 ----

  async function moveTo(target: HTMLElement) {
    guard()
    const cursor = ensureCursor()
    if (!cursor) return

    isActive.value = true
    startMouseGuard()
    cursor.style.display = 'flex'

    const rect = target.getBoundingClientRect()
    const x = rect.left + rect.width / 2 - 16
    const y = rect.top + rect.height / 2 - 16

    target.classList.add('ghost-hand-highlight')

    const { gsap } = await import('gsap')
    await gsap.to(cursor, {
      left: x,
      top: y,
      duration: 0.7,
      ease: 'power2.inOut',
    })
    await wait(350)
    guard()
  }

  async function click(target: HTMLElement) {
    guard()
    const { gsap } = await import('gsap')
    const cursor = cursorEl.value
    if (cursor) {
      await gsap.to(cursor, { scale: 0.8, duration: 0.1 })
      await gsap.to(cursor, { scale: 1, duration: 0.15 })
    }
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await wait(200)
    target.classList.remove('ghost-hand-highlight')
    await wait(300)
    guard()
  }

  async function tap(target: HTMLElement) {
    await moveTo(target)
    await click(target)
  }

  async function tapSelector(selector: string) {
    guard()
    const el = document.querySelector(selector) as HTMLElement | null
    if (!el) throw new Error(`未找到目标元素: ${selector}`)
    await tap(el)
  }

  function hide() {
    if (cursorEl.value) cursorEl.value.style.display = 'none'
    isActive.value = false
    document.querySelectorAll('.ghost-hand-highlight').forEach(el =>
      el.classList.remove('ghost-hand-highlight'),
    )
    stopMouseGuard()
  }

  // ---- 输入辅助 ----

  function findInputEl(target: HTMLElement): HTMLElement | null {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return target
    return target.querySelector('input:not([type="hidden"]), textarea') as HTMLElement | null
  }

  async function waitForSelector(selector: string, timeout = 5000): Promise<HTMLElement | null> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      guard()
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) return el
      await wait(200)
    }
    return null
  }

  async function fillInput(selector: string, text: string) {
    guard()
    const el = await waitForSelector(selector)
    if (!el) { console.warn(`[GhostHand] 未找到元素: ${selector}`); return }

    await tap(el)
    await wait(300)

    const input = findInputEl(el) || el
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.focus()
      input.select()
      await wait(150)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value',
      )?.set || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, text)
      } else {
        input.value = text
      }
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      input.dispatchEvent(new Event('blur', { bubbles: true }))
    }
    await wait(300)
    guard()
  }

  async function selectOption(selector: string, optionText: string) {
    guard()
    const el = await waitForSelector(selector)
    if (!el) { console.warn(`[GhostHand] 未找到元素: ${selector}`); return }

    await tap(el)
    await wait(500)
    guard()

    const options = document.querySelectorAll('.el-select-dropdown:not(.is-hidden) .el-select-dropdown__item')
    for (const opt of options) {
      if (opt.textContent?.trim() === optionText) {
        await tap(opt as HTMLElement)
        await wait(300)
        return
      }
    }
    if (options.length > 0) {
      await tap(options[0] as HTMLElement)
      await wait(300)
    }
  }

  async function fillNumberInput(selector: string, value: number) {
    await fillInput(selector, String(value))
  }

  // ---- 清理 ----

  function abort() {
    isAborted.value = true
    hide()
  }

  onUnmounted(() => {
    stopMouseGuard()
    cursorEl.value?.remove()
    cursorEl.value = null
  })

  return {
    isActive,
    isAborted,
    abort,
    moveTo, click, tap, tapSelector, hide,
    fillInput, fillNumberInput, selectOption, waitForSelector, wait,
  }
}
