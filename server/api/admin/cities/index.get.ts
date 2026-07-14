import { listCities } from '../../../services/xingjian.service'
import { createAdminContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  if (!await createAdminContext(event)) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, data: await listCities(true) }
})
