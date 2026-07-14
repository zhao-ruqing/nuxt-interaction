import { getRankings } from '../../services/xingjian.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  return { success: true, data: await getRankings(Number(query.limit) || 20) }
})
