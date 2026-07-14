import { parseMallProductInput, saveMallProduct } from '../../../services/xingjian-admin.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const id = Number(getRouterParam(event, 'id'))
  const input = parseMallProductInput(await readBody(event))
  const data = await saveMallProduct(id, input)
  await recordXingjianAudit(context, AuditAction.XJ_MALL_UPDATE, 'xingjian_mall_product', String(id), `修改积分商品「${input.name}」`, { after: input })
  return { success: true, data }
})
