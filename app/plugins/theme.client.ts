export default defineNuxtPlugin(() => {
  const storageKey = 'xingjian-theme'
  const stored = localStorage.getItem(storageKey)
  const theme = stored === 'light' || stored === 'dark'
    ? stored
    : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  useState<'dark' | 'light'>('xingjian-theme').value = theme
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
})
