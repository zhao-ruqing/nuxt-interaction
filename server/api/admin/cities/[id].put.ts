import { parseCityInput, updateCity } from '../../../services/xingjian.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  if (!await createContext(event)) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, data: await updateCity(Number(getRouterParam(event, 'id')), parseCityInput(await readBody(event))) }
})
