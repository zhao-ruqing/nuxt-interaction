// 浏览器往返缓存（bfcache）恢复时重新建立 HMR WebSocket 连接
export default defineNuxtPlugin(() => {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload()
    }
  })
})
