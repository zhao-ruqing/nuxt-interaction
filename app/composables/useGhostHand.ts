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

  onUnmounted(() => {
    cursorEl.value?.remove()
    cursorEl.value = null
  })

  return { isActive, moveTo, click, tap, tapSelector, hide }
}
