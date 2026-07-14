import { exchangeMallProduct } from '../../../services/xingjian.service'
import { createContext } from '../../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录后兑换' })
  const body = await readBody(event)
  const data = await exchangeMallProduct(context.user.id, Number(body?.productId), Number(body?.quantity || 1), {
    name: String(body?.receiverName || '').trim(),
    phone: String(body?.receiverPhone || '').trim(),
    address: String(body?.receiverAddress || '').trim(),
  })
  return { success: true, message: '兑换成功', data }
})
