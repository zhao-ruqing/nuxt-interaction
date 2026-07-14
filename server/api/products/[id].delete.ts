import { createAdminContext } from '../../utils/context'
import { deleteProduct } from '../../services/product.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    return { success: false, message: '无效的商品 ID' }
  }

  try {
    const deleted = await deleteProduct(ctx, id)
    if (!deleted) {
      return { success: false, message: '商品不存在' }
    }
    return { success: true, data: { id } }
  }
  catch {
    return { success: false, message: '删除失败，请确认数据库已连接' }
  }
})
