import { completeRoute } from '../../../services/xingjian.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const data = await completeRoute(context.user.id, Number(getRouterParam(event, 'id')))
  return { success: true, message: `路线完成，获得 ${data.awarded} 积分`, data }
})
