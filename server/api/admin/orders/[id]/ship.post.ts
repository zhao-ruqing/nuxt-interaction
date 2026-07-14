import { shipExchangeOrder } from '../../../../services/xingjian-admin.service'
import { createContext } from '../../../../utils/context'
export default defineEventHandler(async (event) => { if (!await createContext(event)) throw createError({ statusCode: 401, message: '请先登录' }); return { success: true, message: '订单已标记发货', data: await shipExchangeOrder(Number(getRouterParam(event, 'id'))) } })
