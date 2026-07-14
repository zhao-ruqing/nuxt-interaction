import { listCities } from '../../services/xingjian.service'

export default defineEventHandler(async () => ({ success: true, data: await listCities() }))
