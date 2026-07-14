import { listPoints } from '../../services/xingjian.service'
import { getAuthUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user = await getAuthUser(event)
  const data = await listPoints({
    cityId: query.cityId ? Number(query.cityId) : undefined,
    keyword: String(query.keyword || '').trim() || undefined,
    userId: user?.id,
  })
  return { success: true, data }
})
