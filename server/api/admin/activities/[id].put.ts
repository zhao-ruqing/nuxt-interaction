import { parseActivityInput, saveActivity } from '../../../services/xingjian-admin.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const id = Number(getRouterParam(event, 'id'))
  const input = parseActivityInput(await readBody(event))
  const data = await saveActivity(id, input)
  await recordXingjianAudit(context, AuditAction.XJ_ACTIVITY_UPDATE, 'xingjian_activity', String(id), `修改活动「${input.title}」`, { after: input })
  return { success: true, data }
})
