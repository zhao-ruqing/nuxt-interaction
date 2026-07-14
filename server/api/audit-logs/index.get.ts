import { createAdminContext } from '../../utils/context'
import { listAuditLogs } from '../../services/audit.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const query = getQuery(event)

  try {
    const data = await listAuditLogs({
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 20,
      action: query.action as string | undefined,
      resourceType: query.resourceType as string | undefined,
      keyword: query.keyword as string | undefined,
      startDate: query.startDate as string | undefined,
      endDate: query.endDate as string | undefined,
    })
    return { success: true, data }
  }
  catch {
    return { success: false, message: '查询失败，请确认 audit_logs 表已创建' }
  }
})
