import { createAdminContext } from '../../utils/context'
import { parseProductInput, updateProduct } from '../../services/product.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    return { success: false, message: '无效的商品 ID' }
  }

  const body = await readBody(event)
  const parsed = parseProductInput(body ?? {})
  if (!parsed.ok) {
    return { success: false, message: parsed.message }
  }

  try {
    const product = await updateProduct(ctx, id, parsed.data)
    if (!product) {
      return { success: false, message: '商品不存在' }
    }
    return { success: true, data: product }
  }
  catch {
    return { success: false, message: '更新失败，请确认数据库已连接' }
  }
})
