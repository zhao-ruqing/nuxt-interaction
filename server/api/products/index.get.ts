import { products, categories } from '../../data/products'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const category = query.category as string | undefined
  const keyword = (query.keyword as string | undefined)?.trim().toLowerCase()

  let result = [...products]

  if (category && category !== 'all') {
    result = result.filter(p => p.category === category)
  }

  if (keyword) {
    result = result.filter(
      p =>
        p.name.toLowerCase().includes(keyword)
        || p.description.toLowerCase().includes(keyword)
        || p.tags.some(t => t.toLowerCase().includes(keyword)),
    )
  }

  return {
    success: true,
    data: {
      list: result,
      categories,
      total: result.length,
    },
  }
})
