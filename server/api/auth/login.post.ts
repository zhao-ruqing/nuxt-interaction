import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'
import pool from '../../utils/db'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'nuxt-interaction-jwt-secret-key-2025')

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' }
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]) as any
  if (rows.length === 0) {
    return { success: false, message: '用户名或密码错误' }
  }

  const user = rows[0]
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return { success: false, message: '用户名或密码错误' }
  }

  const token = await new SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { success: true, user: { id: user.id, username: user.username } }
})
