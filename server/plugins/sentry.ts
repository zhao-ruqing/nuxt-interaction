import * as Sentry from '@sentry/nuxt'
import { getSentryDsn } from '../utils/config'

/** 服务端 Sentry 初始化（DSN 从数据库读取） */
export default defineNitroPlugin(async () => {
  if (Sentry.getClient()) return

  try {
    const dsn = await getSentryDsn()
    if (!dsn) return

    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      enableLogs: true,
    })
  } catch {
    console.warn('[sentry] 服务端初始化失败，请检查 system_configs 表 sentry_dsn 配置')
  }
})
