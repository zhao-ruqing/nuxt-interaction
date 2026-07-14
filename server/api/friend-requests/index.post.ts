import { sendFriendRequest } from '../../services/xingjian-social.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const body = await readBody(event)
  return { success: true, message: '好友申请已发送', data: await sendFriendRequest(context.user.id, String(body?.username || '').trim(), String(body?.message || '').trim()) }
})
