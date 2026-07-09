export type DiffStatus = 'unchanged' | 'changed' | 'added' | 'removed'

export interface DiffRow {
  key: string
  label: string
  before: string
  after: string
  status: DiffStatus
}

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  name: '名称',
  address: '地址',
  lng: '经度',
  lat: '纬度',
  category: '分类',
  categoryName: '分类名称',
  price: '售价',
  originalPrice: '原价',
  description: '描述',
  image: '图标',
  tags: '标签',
  rating: '评分',
  sales: '销量',
  stock: '库存',
  specs: '规格',
  ingredients: '配料',
  created_at: '创建时间',
  updated_at: '更新时间',
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

/** 将对象扁平化为 key-value，嵌套用点号连接 */
function flattenObject(obj: unknown, prefix = ''): Record<string, string> {
  if (obj === null || obj === undefined) return {}

  if (Array.isArray(obj) || typeof obj !== 'object') {
    return prefix ? { [prefix]: formatValue(obj) } : {}
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey))
    }
    else {
      result[fullKey] = formatValue(value)
    }
  }
  return result
}

function getFieldLabel(key: string): string {
  const base = key.split('.').pop() ?? key
  return FIELD_LABELS[base] ?? FIELD_LABELS[key] ?? key
}

/** 从审计 metadata 构建左右对比行 */
export function buildAuditDiff(metadata: Record<string, unknown> | null): DiffRow[] {
  if (!metadata) return []

  const before = flattenObject(metadata.before)
  const after = flattenObject(metadata.after)
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()

  return keys.map((key) => {
    const beforeVal = before[key] ?? ''
    const afterVal = after[key] ?? ''

    let status: DiffStatus = 'unchanged'
    if (beforeVal && afterVal) {
      status = beforeVal === afterVal ? 'unchanged' : 'changed'
    }
    else if (!beforeVal && afterVal) {
      status = 'added'
    }
    else if (beforeVal && !afterVal) {
      status = 'removed'
    }

    return {
      key,
      label: getFieldLabel(key),
      before: beforeVal,
      after: afterVal,
      status,
    }
  })
}

/** 是否适合展示 diff 视图 */
export function canShowDiff(metadata: Record<string, unknown> | null): boolean {
  if (!metadata) return false
  return 'before' in metadata || 'after' in metadata
}
