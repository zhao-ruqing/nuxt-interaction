import { updateSettings } from '../../../services/xingjian-admin.service'
import { AuditAction } from '../../../audit/actions'
import { recordXingjianAudit } from '../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const body = await readBody(event)
  const data = await updateSettings(context.user.id, body)
  await recordXingjianAudit(context, AuditAction.XJ_SETTINGS_UPDATE, 'xingjian_settings', 'global', '修改行鉴系统设置', { after: body })
  return { success: true, message: '系统设置已保存', data }
})
