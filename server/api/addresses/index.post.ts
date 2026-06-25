import pool from '../../utils/db'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const { address, lng, lat } = await readBody(event)
  if (!address?.trim() || lng == null || lat == null) {
    return { success: false, message: '地址和坐标不能为空' }
  }

  const [result] = await pool.query(
    'INSERT INTO addresses (user_id, address, lng, lat) VALUES (?, ?, ?, ?)',
    [user.id, address.trim(), lng, lat],
  ) as any

  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE id = ?',
    [result.insertId],
  ) as any

  return { success: true, data: rows[0] }
})
