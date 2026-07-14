import { parseCityInput, updateCity } from '../../../services/xingjian.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const id = Number(getRouterParam(event, 'id'))
  const data = await updateCity(id, parseCityInput(await readBody(event)))
  await recordXingjianAudit(context, AuditAction.XJ_CITY_UPDATE, 'xingjian_city', String(id), `修改城市「${data.name}」`, { after: data })
  return { success: true, data }
})
