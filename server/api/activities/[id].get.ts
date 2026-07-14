import { getActivity } from '../../services/xingjian.service'

export default defineEventHandler(async (event) => {
  const activity = await getActivity(Number(getRouterParam(event, 'id')))
  if (!activity) throw createError({ statusCode: 404, message: '活动不存在' })
  return { success: true, data: activity }
})
