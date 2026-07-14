import { parseRouteInput, saveRoute } from '../../../services/xingjian-admin.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const input = parseRouteInput(await readBody(event))
  const data = await saveRoute(null, input)
  await recordXingjianAudit(context, AuditAction.XJ_ROUTE_CREATE, 'xingjian_route', String(data.id), `新增路线「${input.name}」`, { after: input })
  return { success: true, data }
})
