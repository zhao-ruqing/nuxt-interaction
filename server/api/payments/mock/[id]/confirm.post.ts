import { confirmMockPayment } from '../../../../services/xingjian.service'
import { createContext } from '../../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const data = await confirmMockPayment(context.user.id, Number(getRouterParam(event, 'id')))
  return { success: true, message: '模拟支付成功，活动报名已确认', data }
})
