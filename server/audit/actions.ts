/** 审计动作常量，新增模块时在此扩展 */
export const AuditAction = {
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  ADDRESS_CREATE: 'address.create',
  ADDRESS_UPDATE: 'address.update',
  ADDRESS_DELETE: 'address.delete',
} as const

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction]

/** 页面筛选用：分组 + 中文标签 */
export const ACTION_REGISTRY = [
  {
    group: 'product',
    label: '商品管理',
    actions: [
      { key: AuditAction.PRODUCT_CREATE, label: '新增' },
      { key: AuditAction.PRODUCT_UPDATE, label: '修改' },
      { key: AuditAction.PRODUCT_DELETE, label: '删除' },
    ],
  },
  {
    group: 'address',
    label: '地图点位',
    actions: [
      { key: AuditAction.ADDRESS_CREATE, label: '新增' },
      { key: AuditAction.ADDRESS_UPDATE, label: '修改' },
      { key: AuditAction.ADDRESS_DELETE, label: '删除' },
    ],
  },
] as const

/** 根据 action 获取中文标签 */
export function getActionLabel(action: string): string {
  for (const group of ACTION_REGISTRY) {
    const found = group.actions.find(a => a.key === action)
    if (found) return `${group.label} · ${found.label}`
  }
  return action
}

/** 根据 action 获取资源类型 */
export function getResourceTypeFromAction(action: string): string {
  return action.split('.')[0] ?? 'unknown'
}
