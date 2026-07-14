import { randomUUID } from 'node:crypto'
import pool from './db'
import type { AuthUser } from './auth'
import { getAuthUser } from './auth'

/** 请求上下文，供 Service 层传递用户与追踪信息 */
export interface RequestContext {
  user: AuthUser
  ip?: string
  requestId: string
}

/** 从未登录请求构建上下文，未登录返回 null */
export async function createContext(event: Parameters<typeof getAuthUser>[0]): Promise<RequestContext | null> {
  const user = await getAuthUser(event)
  if (!user) return null

  return {
    user,
    ip: getRequestIP(event, { xForwardedFor: true }) ?? undefined,
    requestId: getRequestHeader(event, 'x-request-id') ?? randomUUID(),
  }
}

export async function createAdminContext(event: Parameters<typeof getAuthUser>[0]): Promise<RequestContext | null> {
  const context = await createContext(event)
  if (!context) return null
  const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [context.user.id]) as any
  if (rows[0]?.role !== 'admin') {
    throw createError({ statusCode: 403, message: '需要管理员权限' })
  }
  context.user.role = 'admin'
  return context
}
