import { parseRouteInput, saveRoute } from '../../../services/xingjian-admin.service'
import { createContext } from '../../../utils/context'
export default defineEventHandler(async (event) => { if (!await createContext(event)) throw createError({ statusCode: 401, message: '请先登录' }); return { success: true, data: await saveRoute(Number(getRouterParam(event, 'id')), parseRouteInput(await readBody(event))) } })
