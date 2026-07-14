import { parsePointInput, updatePoint } from '../../../services/xingjian.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const id = Number(getRouterParam(event, 'id'))
  const data = await updatePoint(id, parsePointInput(await readBody(event)))
  await recordXingjianAudit(context, AuditAction.XJ_POINT_UPDATE, 'xingjian_point', String(id), `修改点位「${data?.name}」`, { after: data })
  return { success: true, data }
})
