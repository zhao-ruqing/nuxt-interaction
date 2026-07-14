import { createAdminContext } from '../../utils/context'
import { listAddresses } from '../../services/address.service'

export default defineEventHandler(async (event) => {
  const ctx = await createAdminContext(event)
  if (!ctx) {
    return { success: false, message: '未登录' }
  }

  const data = await listAddresses(ctx.user.id)
  return { success: true, data }
})
