import { listMallProducts } from '../../../services/xingjian.service'

export default defineEventHandler(async () => ({ success: true, data: await listMallProducts() }))
