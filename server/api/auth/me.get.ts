import { jwtVerify } from 'jose'
import pool from '../../utils/db'

const JWT_SECRET = new TextEncoder().encode('nuxt-interaction-jwt-secret-key-2025')

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    return { success: false, message: '未登录' }
  }

  let payload: any
  try {
    const result = await jwtVerify(token, JWT_SECRET)
    payload = result.payload
  } catch {
    return { success: false, message: '登录已过期，请重新登录' }
  }

  const [rows] = await pool.query('SELECT id, username, created_at FROM users WHERE id = ?', [payload.id]) as any
  if (rows.length === 0) {
    return { success: false, message: '用户不存在' }
  }

  return { success: true, user: rows[0] }
})
