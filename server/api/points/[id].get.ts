import { getPoint } from '../../services/xingjian.service'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const user = await getAuthUser(event)
  const point = await getPoint(id, user?.id)
  if (!point) throw createError({ statusCode: 404, message: '点位不存在' })
  return { success: true, data: point }
})
