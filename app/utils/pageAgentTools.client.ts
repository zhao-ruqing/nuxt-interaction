import { navigateTo } from '#app'
import type { PageAgent } from 'page-agent'
import { tool } from 'page-agent'
import { z } from 'zod/v4'

/** 允许 Agent 直接导航的站内白名单前缀（不含根路径，根路径单独放行） */
const ALLOWED_PATH_PREFIXES = [
  '/products',
  '/payment',
  '/mall',
  '/orders',
  '/profile',
  '/cities',
  '/checkins',
  '/routes',
  '/activities',
  '/rankings',
  '/friends',
  '/xingjian',
  '/auth',
  '/dashboard',
] as const

/** 导航误用 action 名 → 映射到 navigate_app_route */
const NAVIGATE_ACTION_ALIASES = new Set([
  'path',
  'route',
  'target',
  'url',
  'to',
  'dest',
  'goto',
  'go_to',
  'href',
  'page',
  'pathname',
])

/** 搜索误用 action 名 → 映射到 search_products */
const SEARCH_ACTION_ALIASES = new Set([
  'keyword',
  'query',
  'q',
  'product',
  'search',
  'keywords',
])

/** 校验是否为允许的应用内路径 */
function isAllowedPath(route: string): boolean {
  if (!route.startsWith('/') || route.startsWith('//')) return false
  if (route.includes('://')) return false
  if (route === '/') return true
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`),
  )
}

/** 从任意入参形态中提取字符串 */
function extractString(val: unknown, keys: string[]): string {
  if (typeof val === 'string') return val.trim()
  if (val && typeof val === 'object') {
    const o = val as Record<string, unknown>
    for (const key of keys) {
      if (o[key] != null && String(o[key]).trim()) return String(o[key]).trim()
    }
    const first = Object.values(o).find((v) => typeof v === 'string' && v.trim())
    if (typeof first === 'string') return first.trim()
  }
  return ''
}

/** 导航入参：字段名与工具名相同，便于模型「误用参数名当 action」时仍命中 */
const navigateInputSchema = z.preprocess((val) => {
  const navigate_app_route = extractString(val, [
    'navigate_app_route',
    'target',
    'route',
    'path',
    'url',
    'to',
    'dest',
  ])
  return { navigate_app_route }
}, z.object({ navigate_app_route: z.string() }))

/** 搜索入参：字段名与工具名相同 */
const searchInputSchema = z.preprocess((val) => {
  const search_products = extractString(val, [
    'search_products',
    'keyword',
    'query',
    'q',
    'product',
    'target',
  ])
  return { search_products }
}, z.object({ search_products: z.string() }))

/** 执行站内导航 */
async function navigateInApp(route: string): Promise<string> {
  if (!route) return '拒绝导航：路由为空'
  if (!isAllowedPath(route)) {
    return `拒绝导航：路由不在白名单内（${route}）`
  }
  await navigateTo(route)
  return `已导航到 ${route}`
}

/** 打开商品搜索 */
async function openProductSearch(keyword: string): Promise<string> {
  const q = keyword.trim()
  await navigateTo({
    path: '/products',
    query: q ? { keyword: q } : {},
  })
  return q ? `已打开商品列表，关键词：${q}` : '已打开商品列表'
}

/**
 * 创建 Page Agent 业务自定义工具
 * 只注册少量正式工具，避免污染 MacroTool 的 action 列表
 */
export function createPageAgentCustomTools() {
  return {
    get_app_context: tool({
      description: '获取当前页面 pathname、标题与查询串。',
      inputSchema: z.object({
        reason: z.string().optional().describe('可选说明'),
      }),
      execute: async () => {
        const { pathname, search, href } = window.location
        return JSON.stringify({
          href,
          pathname,
          query: search || '',
          title: document.title,
        })
      },
    }),

    navigate_app_route: tool({
      description:
        '站内跳转。传入路由字符串，例如 /products、/mall、/checkins。推荐写法：{"navigate_app_route":"/mall"}',
      inputSchema: navigateInputSchema,
      execute: async (input) =>
        navigateInApp(String((input as { navigate_app_route: string }).navigate_app_route || '')),
    }),

    search_products: tool({
      description:
        '打开 /products 并按关键词筛选。推荐写法：{"search_products":"咖啡"}',
      inputSchema: searchInputSchema,
      execute: async (input) =>
        openProductSearch(String((input as { search_products: string }).search_products || '')),
    }),
  }
}

/**
 * 安装 action 别名兜底：DeepSeek 常把参数名当成 action 名
 * 写入同一工具实例，使 validateAction 与 MacroTool union 都能识别
 */
export function installPageAgentToolAliases(agent: PageAgent) {
  const tools = agent.tools as Map<string, unknown>
  const navigate = tools.get('navigate_app_route')
  const search = tools.get('search_products')
  if (!navigate || !search) return

  for (const name of NAVIGATE_ACTION_ALIASES) {
    if (!tools.has(name)) tools.set(name, navigate)
  }
  for (const name of SEARCH_ACTION_ALIASES) {
    if (!tools.has(name)) tools.set(name, search)
  }
}
