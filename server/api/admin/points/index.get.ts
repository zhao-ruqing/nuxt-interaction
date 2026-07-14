import { listPoints } from '../../../services/xingjian.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  if (!await createAdminContext(event)) throw createError({ statusCode: 401, message: '请先登录' })
  const query = getQuery(event)
  return { success: true, data: await listPoints({ cityId: query.cityId ? Number(query.cityId) : undefined, includeAll: true }) }
})
