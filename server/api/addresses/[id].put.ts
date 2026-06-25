import pool from '../../utils/db'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const id = getRouterParam(event, 'id')
  const { address, lng, lat } = await readBody(event)
  if (!address?.trim() || lng == null || lat == null) {
    return { success: false, message: '地址和坐标不能为空' }
  }

  const [existing] = await pool.query(
    'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
    [id, user.id],
  ) as any
  if (existing.length === 0) {
    return { success: false, message: '地址不存在' }
  }

  await pool.query(
    'UPDATE addresses SET address = ?, lng = ?, lat = ? WHERE id = ? AND user_id = ?',
    [address.trim(), lng, lat, id, user.id],
  )

  const [rows] = await pool.query(
    'SELECT id, address, lng, lat, created_at, updated_at FROM addresses WHERE id = ?',
    [id],
  ) as any

  return { success: true, data: rows[0] }
})
