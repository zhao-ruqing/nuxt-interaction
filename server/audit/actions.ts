/** 审计动作常量，新增模块时在此扩展 */
export const AuditAction = {
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  ADDRESS_CREATE: 'address.create',
  ADDRESS_UPDATE: 'address.update',
  ADDRESS_DELETE: 'address.delete',
  XJ_CITY_CREATE: 'xingjian.city.create',
  XJ_CITY_UPDATE: 'xingjian.city.update',
  XJ_POINT_CREATE: 'xingjian.point.create',
  XJ_POINT_UPDATE: 'xingjian.point.update',
  XJ_ROUTE_CREATE: 'xingjian.route.create',
  XJ_ROUTE_UPDATE: 'xingjian.route.update',
  XJ_ACTIVITY_CREATE: 'xingjian.activity.create',
  XJ_ACTIVITY_UPDATE: 'xingjian.activity.update',
  XJ_MALL_CREATE: 'xingjian.mall.create',
  XJ_MALL_UPDATE: 'xingjian.mall.update',
  XJ_ORDER_SHIP: 'xingjian.order.ship',
  XJ_USER_ROLE_UPDATE: 'xingjian.user.role-update',
  XJ_SETTINGS_UPDATE: 'xingjian.settings.update',
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
  {
    group: 'xingjian',
    label: '行鉴管理',
    actions: [
      { key: AuditAction.XJ_CITY_CREATE, label: '新增城市' },
      { key: AuditAction.XJ_CITY_UPDATE, label: '修改城市' },
      { key: AuditAction.XJ_POINT_CREATE, label: '新增点位' },
      { key: AuditAction.XJ_POINT_UPDATE, label: '修改点位' },
      { key: AuditAction.XJ_ROUTE_CREATE, label: '新增路线' },
      { key: AuditAction.XJ_ROUTE_UPDATE, label: '修改路线' },
      { key: AuditAction.XJ_ACTIVITY_CREATE, label: '新增活动' },
      { key: AuditAction.XJ_ACTIVITY_UPDATE, label: '修改活动' },
      { key: AuditAction.XJ_MALL_CREATE, label: '新增积分商品' },
      { key: AuditAction.XJ_MALL_UPDATE, label: '修改积分商品' },
      { key: AuditAction.XJ_ORDER_SHIP, label: '订单发货' },
      { key: AuditAction.XJ_USER_ROLE_UPDATE, label: '修改用户角色' },
      { key: AuditAction.XJ_SETTINGS_UPDATE, label: '修改系统设置' },
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
