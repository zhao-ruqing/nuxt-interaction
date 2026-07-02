import { getAuthUser } from '../../utils/auth'
import { createProduct, parseProductInput } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const body = await readBody(event)
  const parsed = parseProductInput(body ?? {})
  if (!parsed.ok) {
    return { success: false, message: parsed.message }
  }

  try {
    const product = await createProduct(parsed.data)
    return { success: true, data: product }
  }
  catch {
    return { success: false, message: '创建失败，请确认数据库已连接且 products 表存在' }
  }
})
