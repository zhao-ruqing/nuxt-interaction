import { createPoint, parsePointInput } from '../../../services/xingjian.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  if (!await createContext(event)) throw createError({ statusCode: 401, message: '请先登录' })
  return { success: true, data: await createPoint(parsePointInput(await readBody(event))) }
})
