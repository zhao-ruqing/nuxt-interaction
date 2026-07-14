/** 幽灵手忙碌状态（跨组件共享，用于关闭 AI 浮窗等） */
export function useGhostHandBusy() {
  return useState('ghost-hand-busy', () => false)
}

/**
 * 幽灵手：虚拟光标移动并模拟点击。
 * 用户移动超过阈值距离，或真实点击页面时中止。
 */
export function useGhostHand() {
  const cursorEl = ref<HTMLElement | null>(null)
  const isActive = ref(false)
  const isAborted = ref(false)
  const busy = useGhostHandBusy()

  /** 累计移动超过该像素数后才中止（避免轻微抖动打断） */
  const ABORT_DISTANCE = 56

  let mouseGuard: ((e: MouseEvent) => void) | null = null
  let clickGuard: ((e: MouseEvent) => void) | null = null
  let guardOriginX = 0
  let guardOriginY = 0
  let guardOriginSet = false

  // ---- 用户中止守护 ----

  /** 执行中止并提示 */
  function abortByUser(reason: string) {
    if (isAborted.value) return
    isAborted.value = true
    hide()
    ElMessage.warning(reason)
  }

  /** 启动鼠标守护：长距移动或真实点击才取消 */
  function startMouseGuard() {
    if (mouseGuard) return
    isAborted.value = false
    guardOriginSet = false
    busy.value = true

    mouseGuard = (e: MouseEvent) => {
      if (!e.isTrusted) return
      if (!guardOriginSet) {
        guardOriginX = e.clientX
        guardOriginY = e.clientY
        guardOriginSet = true
        return
      }
      const dist = Math.hypot(e.clientX - guardOriginX, e.clientY - guardOriginY)
      if (dist < ABORT_DISTANCE) return
      abortByUser('检测到较大幅度鼠标移动，幽灵手操作已取消')
    }

    clickGuard = (e: MouseEvent) => {
      if (!e.isTrusted) return
      abortByUser('检测到点击，幽灵手操作已取消')
    }

    window.addEventListener('mousemove', mouseGuard, { passive: true })
    window.addEventListener('mousedown', clickGuard, true)
  }

  /** 停止鼠标守护并清除监听 */
  function stopMouseGuard() {
    if (mouseGuard) {
      window.removeEventListener('mousemove', mouseGuard)
      mouseGuard = null
    }
    if (clickGuard) {
      window.removeEventListener('mousedown', clickGuard, true)
      clickGuard = null
    }
    guardOriginSet = false
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

  /** 隐藏幽灵手光标并清理状态 */
  function hide() {
    if (cursorEl.value) cursorEl.value.style.display = 'none'
    isActive.value = false
    busy.value = false
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
    busy.value = false
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
