@service 商品接口
@baseUrl http://localhost:3000
@version v0.4
@date 2026-07-01
@auth GET 公开；POST/PUT/DELETE 需 Cookie auth_token

---

## 约定

```typescript
/** 成功响应通用结构 */
interface ApiSuccess<T> {
  success: true
  data: T
}

/** 结算接口额外带 message */
interface CheckoutResponse {
  success: true
  message: string
  data: CheckoutResult
}

/** HTTP 错误（createError） */
interface ApiError {
  statusCode: number
  message: string
}
```

字段约定：`?` = 非必填；价格为 `number`（元）；评分为 0~5。

---

## 类型定义

### Category

> 商品分类

```typescript
interface Category {
  key: string    // 分类标识，all=全部
  name: string   // 显示名
}
```

### ProductSpec

> 商品规格

```typescript
interface ProductSpec {
  size: string   // 如「大杯 500ml」
  price: number  // 该规格售价
}
```

### Product

> 商品完整信息

```typescript
interface Product {
  id: number
  name: string
  category: string
  categoryName: string
  price: number
  originalPrice?: number
  description: string
  image: string
  tags: string[]
  rating: number
  sales: number
  stock: number
  specs: ProductSpec[]
  ingredients?: string[]
}
```

### ProductListData

> 商品列表响应 data 字段

```typescript
interface ProductListData {
  list: Product[]
  categories: Category[]
  total: number
}
```

### ProductListResponse

```typescript
interface ProductListResponse {
  success: boolean
  data: ProductListData
}
```

### ProductDetailResponse

```typescript
interface ProductDetailResponse {
  success: boolean
  data: Product
}
```

### CheckoutBody

> POST /api/orders/checkout 请求体

```typescript
interface CheckoutBody {
  productId: number
  quantity?: number   // 默认 1
  password: string    // 至少 6 位
}
```

### CheckoutResult

```typescript
interface CheckoutResult {
  productId: number
  quantity: number
  remainingStock?: number  // 真实扣库存时返回
  simulated?: boolean      // 数据库不可用时 true
}
```

### ProductMutationResponse

```typescript
interface ProductMutationResponse {
  success: boolean
  message?: string
  data?: Product
}
```

### ProductDeleteResponse

```typescript
interface ProductDeleteResponse {
  success: boolean
  message?: string
  data?: { id: number }
}
```

### ProductInput

> 创建/更新请求体

```typescript
interface ProductInput {
  name: string
  category: 'coffee' | 'soda' | 'tea' | 'juice' | 'milk'
  categoryName: string
  price: number
  originalPrice?: number | null
  description: string
  image: string
  tags?: string[]
  rating?: number
  sales?: number
  stock?: number
  specs: ProductSpec[]
  ingredients?: string[] | null
}
```

### DbProductRow

> 数据库行（snake_case，服务端内部映射为 Product）

```typescript
interface DbProductRow {
  id: number
  name: string
  category: string
  category_name: string
  price: number
  original_price: number | null
  description: string
  image: string
  tags: string | string[]       // JSON 列
  rating: number
  sales: number
  stock: number
  specs: string | ProductSpec[] // JSON 列
  ingredients: string | string[] | null
  created_at?: string
  updated_at?: string
}
```

---

## 端点

### 商品 CRUD

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | `/api/products` | — | ProductListResponse | 列表；Query: `category?`, `keyword?` |
| GET | `/api/products/{id}` | — | ProductDetailResponse | 详情 |
| POST | `/api/products` | ProductInput | ProductMutationResponse | 新增，需登录 |
| PUT | `/api/products/{id}` | ProductInput | ProductMutationResponse | 更新，需登录 |
| DELETE | `/api/products/{id}` | — | ProductDeleteResponse | 删除，需登录 |

---

## 实现文件索引

| 文件 | 职责 |
|------|------|
| `server/api/products/index.post.ts` | 新增 |
| `server/api/products/[id].put.ts` | 更新 |
| `server/api/products/[id].delete.ts` | 删除 |
| `server/api/products/index.get.ts` | 列表 + 筛选 |
| `server/api/products/[id].get.ts` | 详情 |
| `server/api/orders/checkout.post.ts` | 支付扣库存 |
| `server/utils/products.ts` | CRUD + 查询 + 内存回退 |
| `server/data/products.ts` | 类型定义 + 内存种子数据 |
| `server/sql/products.sql` | 建表 + 初始数据 |
| `app/types/product.ts` | 前端 TypeScript 类型 |
| `app/pages/dashboard/manage-products.vue` | 后台管理页 |

---

## 订单结算端点

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| POST | `/api/orders/checkout` | CheckoutBody | CheckoutResponse | 支付并扣库存 |

---

## 开发提示

1. 后台页 `/dashboard/manage-products` 已对接完整 CRUD
2. `specs`、`tags`、`ingredients` 存库为 JSON
3. 增删改需登录；查询接口公开
4. 增删改依赖 MySQL，请先执行 `server/sql/products.sql` 导入表结构
