import { createAdminContext } from '../../utils/context'
import { createAddress } from '../../services/address.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const { address, lng, lat } = await readBody(event)
  if (!address?.trim() || lng == null || lat == null) {
    return { success: false, message: '地址和坐标不能为空' }
  }

  try {
    const data = await createAddress(ctx, { address, lng, lat })
    return { success: true, data }
  }
  catch {
    return { success: false, message: '保存失败，请确认数据库已连接' }
  }
})
