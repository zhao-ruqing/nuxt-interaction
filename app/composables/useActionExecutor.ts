import type { AiAction } from '~/composables/useAiChat'
import type { Product, ProductListResponse } from '~/types/product'

const CATEGORY_KEYWORDS: Record<string, string> = {
  咖啡: 'coffee',
  汽水: 'soda',
  可乐: 'soda',
  茶饮: 'tea',
  茶: 'tea',
  果汁: 'juice',
  奶茶: 'milk',
}

/** 根据 AI 指令匹配商品 */
export async function matchProduct(action: AiAction): Promise<Product | null> {
  const res = await $fetch<ProductListResponse>('/api/products')
  if (!res.success) return null

  const list = res.data.list

  if (action.productId) {
    return list.find(p => p.id === Number(action.productId)) || null
  }

  const keyword = action.product?.trim()
  if (!keyword) return null

  const exact = list.find(p => p.name === keyword)
  if (exact) return exact

  const byName = list.filter(p => p.name.includes(keyword))
  if (byName.length === 1) return byName[0]
  if (byName.length > 1) {
    return byName.sort((a, b) => b.sales - a.sales)[0]
  }

  const catKey = CATEGORY_KEYWORDS[keyword]
  if (catKey) {
    const byCat = list.filter(p => p.category === catKey)
    if (byCat.length) return byCat.sort((a, b) => b.sales - a.sales)[0]
  }

  const byCategoryName = list.filter(p => p.categoryName.includes(keyword))
  if (byCategoryName.length) {
    return byCategoryName.sort((a, b) => b.sales - a.sales)[0]
  }

  return null
}

/** 解析规格索引，「默认」取第一项 */
export function resolveSpecIndex(specs: string, productSpecs: { size: string }[]): number {
  if (!productSpecs.length) return 0

  const normalized = specs?.trim()
  if (!normalized || normalized === '默认' || normalized === '标准') return 0

  const idx = productSpecs.findIndex(s =>
    s.size.includes(normalized) || normalized.includes(s.size),
  )
  return idx >= 0 ? idx : 0
}

export function useActionExecutor() {
  const orderStore = useOrderAutomationStore()

  async function executeOrder(action: AiAction) {
    const product = await matchProduct(action)
    if (!product) {
      ElMessage.error(`未找到商品「${action.product}」，请换个说法试试`)
      return
    }

    const quantity = Math.max(1, Number(action.quantity) || 1)
    const specs = action.specs?.trim() || '默认'

    orderStore.setPending({
      productId: product.id,
      productName: product.name,
      specs,
      quantity,
    })

    ElMessage.info(`正在为您打开「${product.name}」...`)
    await navigateTo(`/products/${product.id}`)
  }

  async function execute(action: AiAction) {
    if (!import.meta.client) return

    switch (action.action) {
      case 'ORDER':
        await executeOrder(action)
        break
      case 'NAVIGATE':
        if (action.route) await navigateTo(String(action.route))
        break
      case 'SEARCH':
        await navigateTo({
          path: '/products',
          query: action.product ? { keyword: action.product } : {},
        })
        break
      default:
        ElMessage.warning(`未知操作类型: ${action.action}`)
    }
  }

  return { execute, matchProduct, resolveSpecIndex }
}
