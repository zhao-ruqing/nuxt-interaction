import { getRoute } from '../../services/xingjian.service'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  const route = await getRoute(Number(getRouterParam(event, 'id')), user?.id)
  if (!route) throw createError({ statusCode: 404, message: '路线不存在' })
  return { success: true, data: route }
})
