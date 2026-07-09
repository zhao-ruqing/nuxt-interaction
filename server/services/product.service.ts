import { AuditAction } from '../audit/actions'
import type { RequestContext } from '../utils/context'
import {
  createProduct as createProductRepo,
  deleteProduct as deleteProductRepo,
  getProductById,
  parseProductInput,
  updateProduct as updateProductRepo,
  type ProductInput,
} from '../utils/products'
import { recordAudit } from './audit.service'

export { parseProductInput, type ProductInput }

/** 新增商品并记录审计 */
export async function createProduct(ctx: RequestContext, input: ProductInput) {
  const product = await createProductRepo(input)
  await recordAudit(ctx, {
    action: AuditAction.PRODUCT_CREATE,
    resourceType: 'product',
    resourceId: String(product.id),
    description: `新增了商品「${product.name}」`,
    metadata: { after: product },
  })
  return product
}

/** 更新商品并记录审计 */
export async function updateProduct(ctx: RequestContext, id: number, input: ProductInput) {
  const before = await getProductById(id)
  if (!before) return null

  const after = await updateProductRepo(id, input)
  if (!after) return null

  await recordAudit(ctx, {
    action: AuditAction.PRODUCT_UPDATE,
    resourceType: 'product',
    resourceId: String(id),
    description: `修改了商品「${after.name}」`,
    metadata: { before, after },
  })
  return after
}

/** 删除商品并记录审计 */
export async function deleteProduct(ctx: RequestContext, id: number) {
  const before = await getProductById(id)
  if (!before) return false

  const deleted = await deleteProductRepo(id)
  if (!deleted) return false

  await recordAudit(ctx, {
    action: AuditAction.PRODUCT_DELETE,
    resourceType: 'product',
    resourceId: String(id),
    description: `删除了商品「${before.name}」`,
    metadata: { before },
  })
  return true
}
