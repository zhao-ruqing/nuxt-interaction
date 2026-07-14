import { listRoutes } from '../../services/xingjian.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return { success: true, data: await listRoutes(query.cityId ? Number(query.cityId) : undefined) }
})
