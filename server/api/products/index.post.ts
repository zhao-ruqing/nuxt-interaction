import { createAdminContext } from '../../utils/context'
import { createProduct, parseProductInput } from '../../services/product.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const body = await readBody(event)
  const parsed = parseProductInput(body ?? {})
  if (!parsed.ok) {
    return { success: false, message: parsed.message }
  }

  try {
    const product = await createProduct(ctx, parsed.data)
    return { success: true, data: product }
  }
  catch {
    return { success: false, message: '创建失败，请确认数据库已连接且 products 表存在' }
  }
})
