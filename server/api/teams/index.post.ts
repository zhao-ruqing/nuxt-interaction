import { createTeam } from '../../services/xingjian-social.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const body = await readBody(event)
  return { success: true, message: '团队创建成功', data: await createTeam(context.user.id, String(body?.name || ''), String(body?.description || '')) }
})
