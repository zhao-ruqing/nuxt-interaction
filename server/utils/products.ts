import pool from './db'
import { products as fallbackProducts, categories } from '../data/products'
import type { Product } from '../data/products'

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

export { categories }
