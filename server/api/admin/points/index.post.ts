import { createPoint, parsePointInput } from '../../../services/xingjian.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const data = await createPoint(parsePointInput(await readBody(event)))
  await recordXingjianAudit(context, AuditAction.XJ_POINT_CREATE, 'xingjian_point', String(data?.id), `新增点位「${data?.name}」`, { after: data })
  return { success: true, data }
})
