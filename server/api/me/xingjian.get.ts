import { getUserProfile } from '../../services/xingjian.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, data: await getUserProfile(context.user.id) }
})
