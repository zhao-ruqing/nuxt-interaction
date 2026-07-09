import { randomUUID } from 'node:crypto'
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
