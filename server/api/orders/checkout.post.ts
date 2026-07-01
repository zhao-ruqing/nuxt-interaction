import pool from '../../utils/db'
import { getProductById } from '../../utils/products'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const productId = Number(body?.productId)
  const quantity = Math.max(1, Number(body?.quantity) || 1)
  const password = String(body?.password || '')

  if (!productId || Number.isNaN(productId)) {
    throw createError({ statusCode: 400, message: '无效的商品 ID' })
  }

  if (!password || password.length < 6) {
    throw createError({ statusCode: 400, message: '请输入至少 6 位支付密码' })
  }

  const product = await getProductById(productId)
  if (!product) {
    throw createError({ statusCode: 404, message: '商品不存在' })
  }

  if (product.stock <= 0) {
    throw createError({ statusCode: 400, message: '商品已售罄' })
  }

  if (quantity > product.stock) {
    throw createError({ statusCode: 400, message: `库存不足，当前仅剩 ${product.stock} 件` })
  }

  try {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const [rows] = await conn.query(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [productId],
      ) as [{ stock: number }[], unknown]

      const currentStock = rows[0]?.stock
      if (currentStock == null) {
        throw createError({ statusCode: 404, message: '商品不存在' })
      }
      if (currentStock < quantity) {
        throw createError({ statusCode: 400, message: `库存不足，当前仅剩 ${currentStock} 件` })
      }

      await conn.query(
        'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?',
        [quantity, quantity, productId],
      )
      await conn.commit()

      return {
        success: true,
        message: '支付成功',
        data: { productId, quantity, remainingStock: currentStock - quantity },
      }
    }
    catch (e: any) {
      await conn.rollback()
      throw e
    }
    finally {
      conn.release()
    }
  }
  catch (e: any) {
    if (e.statusCode) throw e
    // 数据库不可用时模拟支付成功
    return {
      success: true,
      message: '支付成功（模拟）',
      data: { productId, quantity, simulated: true },
    }
  }
})
