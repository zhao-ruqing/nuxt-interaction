import { updateUserRole } from '../../../../services/xingjian-admin.service'
import { AuditAction } from '../../../../audit/actions'
import { recordXingjianAudit } from '../../../../services/xingjian-audit.service'
import { createAdminContext } from '../../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createAdminContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录' })
  const body = await readBody(event)
  const id = Number(getRouterParam(event, 'id'))
  const data = await updateUserRole(context.user.id, id, String(body?.role || ''))
  await recordXingjianAudit(context, AuditAction.XJ_USER_ROLE_UPDATE, 'user', String(id), `将用户 #${id} 的角色修改为 ${data.role}`, { after: data })
  return { success: true, message: '角色已更新', data }
})
