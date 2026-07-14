import { createCity, parseCityInput } from '../../../services/xingjian.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const data = await createCity(parseCityInput(await readBody(event)))
  await recordXingjianAudit(context, AuditAction.XJ_CITY_CREATE, 'xingjian_city', String(data.id), `新增城市「${data.name}」`, { after: data })
  return { success: true, data }
})
