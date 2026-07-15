export type XingjianTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'xingjian-theme'

function applyTheme(theme: XingjianTheme) {
  if (!import.meta.client) return
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function useXingjianTheme() {
  const theme = useState<XingjianTheme>('xingjian-theme', () => 'dark')
  const isDark = computed(() => theme.value === 'dark')
  const themeLabel = computed(() => isDark.value ? '切换到白天模式' : '切换到暗黑模式')

  function setTheme(nextTheme: XingjianTheme, animate = true) {
    if (!import.meta.client) {
      theme.value = nextTheme
      return
    }
    if (theme.value === nextTheme && document.documentElement.dataset.theme === nextTheme) return

    const update = () => {
      theme.value = nextTheme
      applyTheme(nextTheme)
    }

    if (!import.meta.client || !animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update()
      return
    }

    const startViewTransition = (document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> }
    }).startViewTransition

    if (startViewTransition) {
      startViewTransition.call(document, update)
      return
    }

    document.documentElement.classList.add('theme-switching')
    update()
    window.setTimeout(() => document.documentElement.classList.remove('theme-switching'), 360)
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  onMounted(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as XingjianTheme | null
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    const initial = stored === 'dark' || stored === 'light' ? stored : preferred
    theme.value = initial
    applyTheme(initial)
  })

  return { theme, isDark, themeLabel, setTheme, toggleTheme }
}
