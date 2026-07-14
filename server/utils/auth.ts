import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'nuxt-interaction-jwt-secret-key-2025')

export interface AuthUser {
  id: number
  username: string
  role: 'user' | 'admin'
}

// 从 cookie 解析当前登录用户
export async function getAuthUser(event: any): Promise<AuthUser | null> {
  const token = getCookie(event, 'auth_token')
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role === 'admin' ? 'admin' : 'user',
    }
  } catch {
    return null
  }
}
