import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin({
  name: 'sentry',
  enforce: 'pre',
  parallel: false,
  async setup() {
    let dsn = ''
    try {
      const config = await $fetch<{ dsn: string }>('/api/config/sentry')
      dsn = config.dsn
    } catch {
      console.warn('[sentry] 无法获取 DSN，请先在 system_configs 表配置 sentry_dsn')
      return
    }

    if (!dsn || Sentry.getClient()) return

    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration(),
      ],
      enableLogs: true,
    })
  },
})
