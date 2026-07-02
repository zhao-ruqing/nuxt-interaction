import pool from './db'

const cache = new Map<string, { value: string; expiresAt: number }>()
const CACHE_TTL_MS = 60_000

/** 从数据库读取系统配置，带 60 秒内存缓存 */
export async function getSystemConfig(key: string): Promise<string | null> {
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const [rows] = await pool.query(
    'SELECT config_value FROM system_configs WHERE config_key = ? LIMIT 1',
    [key],
  ) as [{ config_value: string }[], unknown]

  const value = rows[0]?.config_value?.trim() || null
  if (value) {
    cache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
  }
  return value
}

/** 获取 Dify API Key：优先数据库，其次环境变量 */
export async function getDifyApiKey(): Promise<string> {
  const fromDb = await getSystemConfig('dify_api_key')
  if (fromDb) return fromDb

  const fromEnv = process.env.DIFY_API_KEY?.trim()
  if (fromEnv) return fromEnv

  throw createError({ statusCode: 500, message: '未配置 Dify API Key，请在 system_configs 表中设置 dify_api_key' })
}

/** 获取 DeepSeek API Key：优先数据库，其次环境变量 */
export async function getDeepSeekApiKey(): Promise<string> {
  const fromDb = await getSystemConfig('deepseek_api_key')
  if (fromDb) return fromDb

  const fromEnv = process.env.DEEPSEEK_API_KEY?.trim()
  if (fromEnv) return fromEnv

  throw createError({ statusCode: 500, message: '未配置 DeepSeek API Key，请在 system_configs 表中设置 deepseek_api_key' })
}
