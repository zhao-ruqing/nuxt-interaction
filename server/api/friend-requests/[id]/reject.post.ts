import { respondFriendRequest } from '../../../services/xingjian-social.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, message: '已拒绝申请', data: await respondFriendRequest(context.user.id, Number(getRouterParam(event, 'id')), 'reject') }
})
