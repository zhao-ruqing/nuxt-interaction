import bcrypt from 'bcrypt'
import pool from '../../utils/db'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  if (!username || !password) {
    return { success: false, message: '用户名和密码不能为空' }
  }
  if (username.length < 3 || username.length > 50) {
    return { success: false, message: '用户名长度需在 3-50 个字符之间' }
  }
  if (password.length < 6) {
    return { success: false, message: '密码长度不能少于 6 位' }
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]) as any
  if (rows.length > 0) {
    return { success: false, message: '用户名已被占用' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const [result] = await pool.query("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')", [username, hashedPassword]) as any

  return { success: true, user: { id: result.insertId, username, role: 'user' } }
})
