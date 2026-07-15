import { checkin } from '../../services/xingjian.service'
import { createContext } from '../../utils/context'

export default defineEventHandler(async (event) => {
  const context = await createContext(event)
  if (!context) throw createError({ statusCode: 401, message: '请先登录后打卡' })
  const body = await readBody(event)
  const pointId = Number(body?.pointId)
  if (!pointId) throw createError({ statusCode: 400, message: '点位参数无效' })
  const data = await checkin(context.user.id, pointId, {
    longitude: body?.longitude == null ? undefined : Number(body.longitude),
    latitude: body?.latitude == null ? undefined : Number(body.latitude),
    accuracy: body?.accuracy == null ? undefined : Number(body.accuracy),
  })
  const distanceText = data.distanceMeters == null ? '' : `，距点位约 ${data.distanceMeters} 米`
  return { success: true, message: `打卡成功${distanceText}，获得 ${data.awarded} 积分`, data }
})
