import pool from '../../utils/db'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const id = getRouterParam(event, 'id')

  const [result] = await pool.query(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [id, user.id],
  ) as any

  if (result.affectedRows === 0) {
    return { success: false, message: '地址不存在' }
  }

  return { success: true }
})
