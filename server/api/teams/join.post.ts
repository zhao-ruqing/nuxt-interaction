import { joinTeam } from '../../services/xingjian-social.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const body = await readBody(event)
  return { success: true, message: '已加入团队', data: await joinTeam(context.user.id, String(body?.code || '')) }
})
