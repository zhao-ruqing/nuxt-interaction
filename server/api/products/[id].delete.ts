import { getAuthUser } from '../../utils/auth'
import { deleteProduct } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)
  if (!user) {
    return { success: false, message: '未登录' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    return { success: false, message: '无效的商品 ID' }
  }

  try {
    const deleted = await deleteProduct(id)
    if (!deleted) {
      return { success: false, message: '商品不存在' }
    }
    return { success: true, data: { id } }
  }
  catch {
    return { success: false, message: '删除失败，请确认数据库已连接' }
  }
})
