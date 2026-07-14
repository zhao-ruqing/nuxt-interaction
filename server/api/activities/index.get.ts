import { listActivities } from '../../services/xingjian.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return { success: true, data: await listActivities(query.cityId ? Number(query.cityId) : undefined) }
})
