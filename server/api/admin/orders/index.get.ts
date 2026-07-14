import { listExchangeOrders } from '../../../services/xingjian-admin.service'
import { createAdminContext } from '../../../utils/context'
export default defineEventHandler(async (event) => { if (!await createAdminContext(event)) throw createError({ statusCode: 401, message: '请先登录' }); return { success: true, data: await listExchangeOrders() } })
