import { getProductById } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, message: '无效的商品 ID' })
  }

  const product = await getProductById(id)

  if (!product) {
    throw createError({ statusCode: 404, message: '商品不存在' })
  }

  return { success: true, data: product }
})
