import { registerActivity } from '../../../services/xingjian.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录后报名' })
  const body = await readBody(event)
  const data = await registerActivity(
    context.user.id,
    Number(getRouterParam(event, 'id')),
    String(body?.contactName || '').trim(),
    String(body?.contactPhone || '').trim(),
  )
  return { success: true, message: '报名单已创建，请完成模拟支付', data }
})
