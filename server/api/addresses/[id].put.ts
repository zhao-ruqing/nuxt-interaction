import { createAdminContext } from '../../utils/context'
import { updateAddress } from '../../services/address.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || Number.isNaN(id)) {
    return { success: false, message: '无效的地址 ID' }
  }

  const { address, lng, lat } = await readBody(event)
  if (!address?.trim() || lng == null || lat == null) {
    return { success: false, message: '地址和坐标不能为空' }
  }

  try {
    const data = await updateAddress(ctx, id, { address, lng, lat })
    if (!data) {
      return { success: false, message: '地址不存在' }
    }
    return { success: true, data }
  }
  catch {
    return { success: false, message: '更新失败，请确认数据库已连接' }
  }
})
