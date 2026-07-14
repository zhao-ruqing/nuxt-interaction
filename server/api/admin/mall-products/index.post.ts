import { parseMallProductInput, saveMallProduct } from '../../../services/xingjian-admin.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const input = parseMallProductInput(await readBody(event))
  const data = await saveMallProduct(null, input)
  await recordXingjianAudit(context, AuditAction.XJ_MALL_CREATE, 'xingjian_mall_product', String(data.id), `新增积分商品「${input.name}」`, { after: input })
  return { success: true, data }
})
