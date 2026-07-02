/** 幽灵手：虚拟光标移动并模拟点击 */
export function useGhostHand() {
  const cursorEl = ref<HTMLElement | null>(null)
  const isActive = ref(false)

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

  async function moveTo(target: HTMLElement) {
    const cursor = ensureCursor()
    if (!cursor) return

    isActive.value = true
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
  }

  async function click(target: HTMLElement) {
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
  }

  async function tap(target: HTMLElement) {
    await moveTo(target)
    await click(target)
  }

  async function tapSelector(selector: string) {
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
  }

  /** 查找目标元素内的实际 input/textarea */
  function findInputEl(target: HTMLElement): HTMLElement | null {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return target
    return target.querySelector('input:not([type="hidden"]), textarea') as HTMLElement | null
  }

  /** 等待元素出现在 DOM 中 */
  async function waitForSelector(selector: string, timeout = 5000): Promise<HTMLElement | null> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) return el
      await wait(200)
    }
    return null
  }

  /** 填写输入框：点击聚焦 → 清空 → 逐字输入 */
  async function fillInput(selector: string, text: string) {
    const el = await waitForSelector(selector)
    if (!el) { console.warn(`[GhostHand] 未找到元素: ${selector}`); return }

    await tap(el)
    await wait(300)

    const input = findInputEl(el) || el
    // 清空已有内容
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      input.focus()
      input.select()
      await wait(150)
      // 直接用原生方式设置值并触发事件，比逐字输入更可靠
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
  }

  /** 操作 el-select：点击展开 → 选中指定选项 */
  async function selectOption(selector: string, optionText: string) {
    const el = await waitForSelector(selector)
    if (!el) { console.warn(`[GhostHand] 未找到元素: ${selector}`); return }

    // 点击 select 触发下拉
    await tap(el)
    await wait(500)

    // 从弹出层中找到目标选项并点击
    const options = document.querySelectorAll('.el-select-dropdown:not(.is-hidden) .el-select-dropdown__item')
    for (const opt of options) {
      if (opt.textContent?.trim() === optionText) {
        await tap(opt as HTMLElement)
        await wait(300)
        return
      }
    }
    // 如果没找到精确匹配，点击第一个（兜底）
    if (options.length > 0) {
      await tap(options[0] as HTMLElement)
      await wait(300)
    }
  }

  /** 操作 el-input-number：点击聚焦 → 清空 → 填入数字 */
  async function fillNumberInput(selector: string, value: number) {
    await fillInput(selector, String(value))
  }

  onUnmounted(() => {
    cursorEl.value?.remove()
    cursorEl.value = null
  })

  return {
    isActive, moveTo, click, tap, tapSelector, hide,
    fillInput, fillNumberInput, selectOption, waitForSelector, wait,
  }
}
