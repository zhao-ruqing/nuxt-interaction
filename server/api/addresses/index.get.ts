import pool from '../../utils/db'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
    [user.id],
  ) as any

  return { success: true, data: rows }
})
