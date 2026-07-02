import pool from './db'
import { products as fallbackProducts, categories } from '../data/products'
import type { Product, ProductSpec } from '../data/products'

export interface ProductInput {
  name: string
  category: string
  categoryName: string
  price: number
  originalPrice?: number | null
  description: string
  image: string
  tags: string[]
  rating?: number
  sales?: number
  stock?: number
  specs: ProductSpec[]
  ingredients?: string[] | null
}

interface DbProductRow {
  id: number
  name: string
  category: string
  category_name: string
  price: number | string
  original_price: number | string | null
  description: string
  image: string
  tags: string | string[]
  rating: number | string
  sales: number
  stock: number
  specs: string | { size: string; price: number }[]
  ingredients: string | string[] | null
}

function parseJson<T>(value: string | T): T {
  return typeof value === 'string' ? JSON.parse(value) : value
}

function mapRow(row: DbProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryName: row.category_name,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    description: row.description,
    image: row.image,
    tags: parseJson<string[]>(row.tags),
    rating: Number(row.rating),
    sales: row.sales,
    stock: row.stock,
    specs: parseJson(row.specs),
    ingredients: row.ingredients ? parseJson<string[]>(row.ingredients) : undefined,
  }
}

/** 从数据库读取全部商品，失败时回退内存数据 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id') as [DbProductRow[], unknown]
    if (rows.length) return rows.map(mapRow)
  }
  catch { /* 数据库不可用时回退 */ }
  return fallbackProducts
}

/** 按 ID 获取商品 */
export async function getProductById(id: number): Promise<Product | null> {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [id],
    ) as [DbProductRow[], unknown]
    if (rows[0]) return mapRow(rows[0])
  }
  catch { /* 回退 */ }
  return fallbackProducts.find(p => p.id === id) ?? null
}

const validCategoryKeys = new Set(
  categories.filter(c => c.key !== 'all').map(c => c.key),
)

/** 校验并规范化商品入参 */
export function parseProductInput(body: Record<string, unknown>): { ok: true, data: ProductInput } | { ok: false, message: string } {
  const name = String(body.name ?? '').trim()
  const category = String(body.category ?? '').trim()
  const categoryName = String(body.categoryName ?? '').trim()
  const description = String(body.description ?? '').trim()
  const image = String(body.image ?? '').trim()
  const price = Number(body.price)
  const originalPrice = body.originalPrice == null || body.originalPrice === ''
    ? null
    : Number(body.originalPrice)
  const rating = body.rating == null ? 5 : Number(body.rating)
  const sales = body.sales == null ? 0 : Number(body.sales)
  const stock = body.stock == null ? 0 : Number(body.stock)
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : []
  const specs = Array.isArray(body.specs) ? body.specs : []
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.map(String)
    : null

  if (!name) return { ok: false, message: '商品名称不能为空' }
  if (!category || !validCategoryKeys.has(category)) return { ok: false, message: '请选择有效分类' }
  if (!categoryName) return { ok: false, message: '分类名称不能为空' }
  if (!description) return { ok: false, message: '商品描述不能为空' }
  if (!image) return { ok: false, message: '展示图标不能为空' }
  if (Number.isNaN(price) || price < 0) return { ok: false, message: '售价无效' }
  if (originalPrice != null && (Number.isNaN(originalPrice) || originalPrice < 0)) {
    return { ok: false, message: '原价无效' }
  }
  if (Number.isNaN(rating) || rating < 0 || rating > 5) return { ok: false, message: '评分需在 0~5 之间' }
  if (Number.isNaN(sales) || sales < 0) return { ok: false, message: '销量无效' }
  if (Number.isNaN(stock) || stock < 0) return { ok: false, message: '库存无效' }
  if (!specs.length) return { ok: false, message: '至少添加一个规格' }

  const normalizedSpecs: ProductSpec[] = []
  for (const item of specs) {
    const row = item as Record<string, unknown>
    const size = String(row.size ?? '').trim()
    const specPrice = Number(row.price)
    if (!size) return { ok: false, message: '规格名称不能为空' }
    if (Number.isNaN(specPrice) || specPrice < 0) return { ok: false, message: '规格价格无效' }
    normalizedSpecs.push({ size, price: specPrice })
  }

  return {
    ok: true,
    data: {
      name,
      category,
      categoryName,
      price,
      originalPrice,
      description,
      image,
      tags,
      rating,
      sales,
      stock,
      specs: normalizedSpecs,
      ingredients,
    },
  }
}

/** 新增商品 */
export async function createProduct(input: ProductInput): Promise<Product> {
  const [result] = await pool.query(
    `INSERT INTO products
      (name, category, category_name, price, original_price, description, image, tags, rating, sales, stock, specs, ingredients)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.category,
      input.categoryName,
      input.price,
      input.originalPrice,
      input.description,
      input.image,
      JSON.stringify(input.tags),
      input.rating ?? 5,
      input.sales ?? 0,
      input.stock ?? 0,
      JSON.stringify(input.specs),
      input.ingredients ? JSON.stringify(input.ingredients) : null,
    ],
  ) as [{ insertId: number }, unknown]

  const product = await getProductById(result.insertId)
  if (!product) throw new Error('创建商品失败')
  return product
}

/** 更新商品 */
export async function updateProduct(id: number, input: ProductInput): Promise<Product | null> {
  const [result] = await pool.query(
    `UPDATE products SET
      name = ?, category = ?, category_name = ?, price = ?, original_price = ?,
      description = ?, image = ?, tags = ?, rating = ?, sales = ?, stock = ?,
      specs = ?, ingredients = ?
     WHERE id = ?`,
    [
      input.name,
      input.category,
      input.categoryName,
      input.price,
      input.originalPrice,
      input.description,
      input.image,
      JSON.stringify(input.tags),
      input.rating ?? 5,
      input.sales ?? 0,
      input.stock ?? 0,
      JSON.stringify(input.specs),
      input.ingredients ? JSON.stringify(input.ingredients) : null,
      id,
    ],
  ) as [{ affectedRows: number }, unknown]

  if (!result.affectedRows) return null
  return getProductById(id)
}

/** 删除商品 */
export async function deleteProduct(id: number): Promise<boolean> {
  const [result] = await pool.query(
    'DELETE FROM products WHERE id = ?',
    [id],
  ) as [{ affectedRows: number }, unknown]
  return result.affectedRows > 0
}

export { categories }
