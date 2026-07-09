import { createContext } from '../../utils/context'
import { deleteAddress } from '../../services/address.service'

export default defineEventHandler(async (event) => {
  const ctx = await createContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    return { success: false, message: '无效的地址 ID' }
  }

  try {
    const deleted = await deleteAddress(ctx, id)
    if (!deleted) {
      return { success: false, message: '地址不存在' }
    }
    return { success: true }
  }
  catch {
    return { success: false, message: '删除失败，请确认数据库已连接' }
  }
})
