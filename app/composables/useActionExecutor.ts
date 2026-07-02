import type { AiAction } from '~/composables/useAiChat'
import type { Product, ProductListResponse } from '~/types/product'
import { useOrderAutomationStore } from '~/stores/orderAutomation'
import { useAdminAutomationStore } from '~/stores/adminAutomation'

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

/** 根据分类 key 获取分类中文名 */
function getCategoryName(category: string): string {
  const map: Record<string, string> = {
    coffee: '咖啡',
    tea: '茶饮',
    juice: '果汁',
    soda: '汽水',
    milk: '奶茶',
  }
  return map[category] || category
}

/** 匹配规格，返回索引与是否命中 */
export function findSpecMatch(
  specs: string,
  productSpecs: { size: string }[],
): { index: number; matched: boolean } {
  if (!productSpecs.length) return { index: 0, matched: true }

  const normalized = specs?.trim()
  if (!normalized || normalized === '默认' || normalized === '标准') {
    return { index: 0, matched: true }
  }

  const idx = productSpecs.findIndex(s =>
    s.size.includes(normalized) || normalized.includes(s.size),
  )
  return idx >= 0 ? { index: idx, matched: true } : { index: 0, matched: false }
}

/** 解析规格索引，「默认」取第一项 */
export function resolveSpecIndex(specs: string, productSpecs: { size: string }[]): number {
  return findSpecMatch(specs, productSpecs).index
}

/** 校验下单数量与库存 */
export function validateOrderQuantity(quantity: number, stock: number): { valid: boolean; message?: string } {
  if (stock <= 0) {
    return { valid: false, message: '商品已售罄' }
  }
  if (quantity > stock) {
    return { valid: false, message: `库存不足，当前仅剩 ${stock} 件（需要 ${quantity} 件）` }
  }
  return { valid: true }
}

export function useActionExecutor() {
  const orderStore = useOrderAutomationStore()

  // ==================== 用户端：下单 ====================

  async function executeOrder(action: AiAction) {
    const product = await matchProduct(action)
    if (!product) {
      ElMessage.error(`未找到商品「${action.product}」，请换个说法试试`)
      return
    }

    const quantity = Math.max(1, Number(action.quantity) || 1)
    const specs = action.specs?.trim() || '默认'

    const specResult = findSpecMatch(specs, product.specs)
    if (!specResult.matched) {
      const available = product.specs.map(s => s.size).join('、')
      ElMessage.warning(`规格「${specs}」不存在，可选：${available}`)
      return
    }

    const qtyCheck = validateOrderQuantity(quantity, product.stock)
    if (!qtyCheck.valid) {
      ElMessage.warning(qtyCheck.message!)
      return
    }

    orderStore.setPending({
      productId: product.id,
      productName: product.name,
      specs,
      quantity,
    })

    ElMessage.info(`正在为您打开「${product.name}」...`)
    await navigateTo(`/products/${product.id}`)
  }

  // ==================== 后台管理：商品 CRUD（幽灵手自动化） ====================

  async function executeProductCreate(action: AiAction) {
    const a = action as any
    const name = a.name?.trim()
    const category = a.category?.trim()
    const price = Number(a.price)

    if (!name) { ElMessage.error('商品名称不能为空'); return }
    if (!category) { ElMessage.error('商品分类不能为空'); return }
    if (isNaN(price) || price < 0) { ElMessage.error('商品价格不合法'); return }

    // 存入自动化任务 Store，由 manage-products 页面的幽灵手执行
    const adminStore = useAdminAutomationStore()
    adminStore.setTask({
      type: 'PRODUCT_CREATE',
      data: {
        name,
        category,
        price,
        description: (a.description || '').trim(),
        image: (a.image || '📦').trim(),
        specs: a.specs || [{ size: '默认', price }],
        tags: a.tags || [],
        stock: Number(a.stock) || 0,
        rating: Number(a.rating) || 5,
        originalPrice: a.originalPrice !== undefined ? Number(a.originalPrice) : undefined,
        sales: Number(a.sales) || 0,
        ingredients: a.ingredients || [],
      },
    })

    await navigateTo('/dashboard/manage-products')
  }

  async function executeProductUpdate(action: AiAction) {
    const a = action as any
    let productId = Number(a.productId)

    if (!productId && a.product) {
      const product = await matchProduct({ action: 'ORDER', product: a.product })
      if (!product) { ElMessage.error(`未找到商品「${a.product}」`); return }
      productId = product.id
    }

    if (!productId) { ElMessage.error('请指定要更新的商品（名称或 ID）'); return }

    const adminStore = useAdminAutomationStore()
    adminStore.setTask({
      type: 'PRODUCT_UPDATE',
      data: {
        productId,
        productName: a.product || a.productName || `ID:${productId}`,
        changes: a.changes || {},
      },
    })

    await navigateTo('/dashboard/manage-products')
  }

  async function executeProductDelete(action: AiAction) {
    const a = action as any
    let productId = Number(a.productId)

    if (!productId && a.product) {
      const product = await matchProduct({ action: 'ORDER', product: a.product })
      if (!product) { ElMessage.error(`未找到商品「${a.product}」`); return }
      productId = product.id
    }

    if (!productId) { ElMessage.error('请指定要删除的商品（名称或 ID）'); return }

    const adminStore = useAdminAutomationStore()
    adminStore.setTask({
      type: 'PRODUCT_DELETE',
      data: {
        productId,
        productName: a.productName || a.product || `ID:${productId}`,
      },
    })

    await navigateTo('/dashboard/manage-products')
  }

  async function executeProductSearch(action: AiAction) {
    const a = action as any
    const adminStore = useAdminAutomationStore()

    if (a.category || a.keyword) {
      // 有筛选条件：用幽灵手自动操作筛选栏
      adminStore.setTask({
        type: 'PRODUCT_SEARCH',
        data: {
          category: a.category || undefined,
          keyword: a.keyword || undefined,
        },
      })
      await navigateTo('/dashboard/manage-products')
    } else {
      // 无筛选条件：直接跳转
      await navigateTo('/dashboard/manage-products')
    }
  }

  // ==================== 后台管理：地图标注 ====================

  /** 按地址名称模糊匹配地址列表，返回匹配的地址项 */
  async function matchAddressByName(keyword: string): Promise<{ id: number; address: string } | null> {
    if (!keyword) return null
    try {
      const res = await $fetch<{ success: boolean; data?: { id: number; address: string }[] }>('/api/addresses')
      if (!res.success || !res.data?.length) return null
      // 精确匹配
      const exact = res.data.find(a => a.address === keyword)
      if (exact) return exact
      // 包含匹配
      const includes = res.data.filter(a => a.address.includes(keyword))
      if (includes.length === 1) return includes[0]
      // 反向包含匹配（关键词包含地址名）
      const reverse = res.data.find(a => keyword.includes(a.address))
      if (reverse) return reverse
      return null
    } catch {
      return null
    }
  }

  async function executeMapAddAddress(action: AiAction) {
    const a = action as any
    const address = (a.address || '').trim()
    if (!address) { ElMessage.error('地址描述不能为空'); return }

    // 始终走幽灵手：跳转地图页 → 搜索 → 自动保存
    const adminStore = useAdminAutomationStore()
    adminStore.setTask({
      type: 'MAP_ADD_ADDRESS',
      data: { address, autoSave: true },
    })
    await navigateTo('/dashboard/map')
  }

  async function executeMapUpdateAddress(action: AiAction) {
    const a = action as any
    const addressName = (a.address || a.product || '').trim()
    const newAddress = (a.newAddress || a.changes?.address || '').trim()

    if (!addressName) { ElMessage.error('请指定要更新的地址名称'); return }

    // 模糊匹配 → 直接调 API
    const matched = await matchAddressByName(addressName)
    if (!matched) { ElMessage.error(`未找到地址「${addressName}」`); return }

    try {
      const current = await $fetch<{ success: boolean; data?: any }>(`/api/addresses/${matched.id}`)
      const body: Record<string, unknown> = { address: newAddress || matched.address, lng: 0, lat: 0 }
      if (current.success && current.data) {
        body.lng = current.data.lng
        body.lat = current.data.lat
      }
      const res = await $fetch<{ success: boolean; message?: string }>(`/api/addresses/${matched.id}`, {
        method: 'PUT',
        body,
      })
      if (res.success) {
        ElMessage.success(`地址「${addressName}」已更新为「${newAddress || addressName}」`)
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } catch {
      ElMessage.error('更新失败，请稍后重试')
    }
  }

  async function executeMapDeleteAddress(action: AiAction) {
    const a = action as any
    const addressName = (a.address || a.product || '').trim()

    if (!addressName) { ElMessage.error('请指定要删除的地址名称'); return }

    // 模糊匹配 → 直接调 API
    const matched = await matchAddressByName(addressName)
    if (!matched) { ElMessage.error(`未找到地址「${addressName}」`); return }

    try {
      const res = await $fetch<{ success: boolean; message?: string }>(`/api/addresses/${matched.id}`, { method: 'DELETE' })
      if (res.success) {
        ElMessage.success(`地址「${matched.address}」已删除`)
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      ElMessage.error('删除失败，请稍后重试')
    }
  }

  async function executeMapSearchLocation(action: AiAction) {
    const a = action as any
    const adminStore = useAdminAutomationStore()
    adminStore.setTask({
      type: 'MAP_SEARCH_LOCATION',
      data: {
        keyword: (a.keyword || '').trim(),
        city: (a.city || '').trim(),
      },
    })
    await navigateTo('/dashboard/map')
  }

  async function executeMapListAddresses(_action: AiAction) {
    await navigateTo('/dashboard/map')
  }

  // ==================== 统一调度 ====================

  async function execute(action: AiAction) {
    if (!import.meta.client) return

    switch (action.action) {
      // 用户端
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

      // 后台管理：商品 CRUD
      case 'PRODUCT_CREATE':
        await executeProductCreate(action)
        break
      case 'PRODUCT_UPDATE':
        await executeProductUpdate(action)
        break
      case 'PRODUCT_DELETE':
        await executeProductDelete(action)
        break
      case 'PRODUCT_SEARCH':
        await executeProductSearch(action)
        break

      // 后台管理：地图标注
      case 'MAP_ADD_ADDRESS':
        await executeMapAddAddress(action)
        break
      case 'MAP_UPDATE_ADDRESS':
        await executeMapUpdateAddress(action)
        break
      case 'MAP_DELETE_ADDRESS':
        await executeMapDeleteAddress(action)
        break
      case 'MAP_SEARCH_LOCATION':
        await executeMapSearchLocation(action)
        break
      case 'MAP_LIST_ADDRESSES':
        await executeMapListAddresses(action)
        break

      default:
        ElMessage.warning(`未知操作类型: ${action.action}`)
    }
  }

  return { execute, matchProduct, resolveSpecIndex, findSpecMatch, validateOrderQuantity }
}
