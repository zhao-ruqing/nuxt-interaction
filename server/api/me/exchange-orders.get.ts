import { listUserExchangeOrders } from '../../services/xingjian-admin.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, data: await listUserExchangeOrders(context.user.id) }
})
