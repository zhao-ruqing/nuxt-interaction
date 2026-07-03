import { getSentryDsn } from '../../utils/config'

/** 获取 Sentry DSN，供客户端初始化使用 */
export default defineEventHandler(async () => {
  const dsn = await getSentryDsn()
  return { dsn: dsn ?? '' }
})
