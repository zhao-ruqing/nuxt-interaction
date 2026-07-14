import { getFriendRankings } from '../../services/xingjian-social.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录查看好友榜' })
  return { success: true, data: await getFriendRankings(context.user.id) }
})
