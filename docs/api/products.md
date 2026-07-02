# 商品接口文档

> 数据源：项目源码 `server/api/products/`、`server/api/orders/checkout.post.ts`  
> 版本：v0.4  
> 导出日期：2026-07-01

**Base URL:** `http://localhost:3000`（开发环境，以实际部署为准）

---

## 鉴权

| 接口 | 鉴权 |
|------|------|
| `GET /api/products`、`GET /api/products/{id}` | 无需登录，公开访问 |
| `POST /api/products`、`PUT /api/products/{id}`、`DELETE /api/products/{id}` | **需要登录**，Cookie 携带 `auth_token` |

未登录时增删改返回：

```json
{ "success": false, "message": "未登录" }
```

---

## 通用约定

### 响应封装

成功时统一返回：

```json
{
  "success": true,
  "data": { ... }
}
```

失败时返回 `{ "success": false, "message": "..." }` 或由 Nuxt `createError` 抛出 HTTP 错误（查询接口）：

| HTTP 状态码 | 场景 |
|------------|------|
| 400 | 参数无效、库存不足、密码不符合要求 |
| 404 | 商品不存在 |

错误响应示例：

```json
{
  "statusCode": 404,
  "message": "商品不存在"
}
```

### 数据来源

`server/utils/products.ts` 读取时优先从 MySQL `products` 表读取，失败时回退内存数据。**增删改仅写入数据库**，数据库不可用时会返回失败提示。

---

## 接口目录

- [商品 CRUD](#商品-crud)（5 个接口）
- [订单结算](#订单结算)（1 个接口，涉及库存扣减）
- [数据模型](#数据模型)
- [数据库表结构](#数据库表结构)

---

## 商品 CRUD

### 获取商品列表

`GET` `/api/products`

返回全部商品，支持按分类和关键词筛选。响应中同时附带分类列表，供前端 Tab 使用。

**Query 参数：**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| category | query | string | 否 | 分类标识，如 `coffee`、`soda`；传 `all` 或不传表示全部 |
| keyword | query | string | 否 | 搜索关键词，匹配商品名称、描述、标签（不区分大小写） |

**响应** `success + data`：

| 字段 | 类型 | 说明 |
|------|------|------|
| list | Product[] | 商品列表 |
| categories | Category[] | 全部分类（含 `all`） |
| total | number | 筛选后的商品数量 |

**请求示例：**

```
GET /api/products
GET /api/products?category=coffee
GET /api/products?keyword=拿铁
GET /api/products?category=tea&keyword=奶盖
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "经典美式咖啡",
        "category": "coffee",
        "categoryName": "咖啡",
        "price": 18,
        "originalPrice": 22,
        "description": "精选阿拉比卡咖啡豆...",
        "image": "☕",
        "tags": ["热销", "低卡"],
        "rating": 4.8,
        "sales": 3260,
        "stock": 99,
        "specs": [
          { "size": "中杯 350ml", "price": 18 },
          { "size": "大杯 500ml", "price": 22 }
        ],
        "ingredients": ["阿拉比卡咖啡豆", "纯净水"]
      }
    ],
    "categories": [
      { "key": "all", "name": "全部" },
      { "key": "coffee", "name": "咖啡" },
      { "key": "soda", "name": "汽水" },
      { "key": "tea", "name": "茶饮" },
      { "key": "juice", "name": "果汁" },
      { "key": "milk", "name": "奶茶" }
    ],
    "total": 1
  }
}
```

---

### 获取商品详情

`GET` `/api/products/{id}`

根据商品 ID 返回单条商品完整信息。

**Path 参数：**

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| id | path | number | 是 | 商品 ID |

**响应** `success + data`：`Product` 对象（字段见下方数据模型）

**请求示例：**

```
GET /api/products/1
```

**成功响应示例：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "经典美式咖啡",
    "category": "coffee",
    "categoryName": "咖啡",
    "price": 18,
    "originalPrice": 22,
    "description": "精选阿拉比卡咖啡豆，中深度烘焙...",
    "image": "☕",
    "tags": ["热销", "低卡"],
    "rating": 4.8,
    "sales": 3260,
    "stock": 99,
    "specs": [
      { "size": "中杯 350ml", "price": 18 },
      { "size": "大杯 500ml", "price": 22 },
      { "size": "超大杯 700ml", "price": 26 }
    ],
    "ingredients": ["阿拉比卡咖啡豆", "纯净水"]
  }
}
```

**错误响应：**

| 状态码 | message |
|--------|---------|
| 400 | 无效的商品 ID |
| 404 | 商品不存在 |

---

### 新增商品

`POST` `/api/products`

**需要登录。**

**请求体** (`application/json`)：`ProductInput`（字段见下方）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 商品名称 |
| category | string | 是 | 分类标识：`coffee` / `soda` / `tea` / `juice` / `milk` |
| categoryName | string | 是 | 分类显示名 |
| price | number | 是 | 默认售价 |
| originalPrice | number | 否 | 原价 |
| description | string | 是 | 商品描述 |
| image | string | 是 | 展示图标（emoji） |
| tags | string[] | 否 | 标签，默认 `[]` |
| rating | number | 否 | 评分 0~5，默认 5 |
| sales | number | 否 | 销量，默认 0 |
| stock | number | 否 | 库存，默认 0 |
| specs | ProductSpec[] | 是 | 至少 1 项规格 |
| ingredients | string[] | 否 | 配料 |

**成功响应：**

```json
{ "success": true, "data": { /* Product */ } }
```

**失败响应示例：**

```json
{ "success": false, "message": "商品名称不能为空" }
{ "success": false, "message": "未登录" }
```

---

### 更新商品

`PUT` `/api/products/{id}`

**需要登录。** 请求体字段与「新增商品」相同，全量更新。

**Path 参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 商品 ID |

**成功响应：**

```json
{ "success": true, "data": { /* Product */ } }
```

**失败响应示例：**

```json
{ "success": false, "message": "商品不存在" }
```

---

### 删除商品

`DELETE` `/api/products/{id}`

**需要登录。**

**Path 参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 商品 ID |

**成功响应：**

```json
{ "success": true, "data": { "id": 1 } }
```

**失败响应示例：**

```json
{ "success": false, "message": "商品不存在" }
```

**分类枚举：**

| key | name |
|-----|------|
| coffee | 咖啡 |
| soda | 汽水 |
| tea | 茶饮 |
| juice | 果汁 |
| milk | 奶茶 |

---

## 订单结算

### 提交支付（扣减库存）

`POST` `/api/orders/checkout`

购买商品并扣减库存、增加销量。支付页 `/payment` 与 AI 自动下单流程均调用此接口。

**请求体** (`application/json`)：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productId | number | 是 | 商品 ID |
| quantity | number | 否 | 购买数量，默认 1，最小 1 |
| password | string | 是 | 支付密码，至少 6 位 |

**响应** `success + message + data`：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否成功 |
| message | string | 如「支付成功」 |
| data.productId | number | 商品 ID |
| data.quantity | number | 实际购买数量 |
| data.remainingStock | number | 扣减后剩余库存（数据库可用时） |
| data.simulated | boolean | 数据库不可用时为 `true`，表示模拟支付 |

**请求示例：**

```json
{
  "productId": 1,
  "quantity": 2,
  "password": "123456"
}
```

**成功响应示例：**

```json
{
  "success": true,
  "message": "支付成功",
  "data": {
    "productId": 1,
    "quantity": 2,
    "remainingStock": 97
  }
}
```

**错误响应：**

| 状态码 | message 示例 |
|--------|-------------|
| 400 | 无效的商品 ID |
| 400 | 请输入至少 6 位支付密码 |
| 400 | 商品已售罄 |
| 400 | 库存不足，当前仅剩 N 件 |
| 404 | 商品不存在 |

**业务说明：**

- 使用 `SELECT ... FOR UPDATE` 行锁，事务内扣减 `stock`、增加 `sales`
- 数据库不可用时跳过真实扣减，返回模拟成功（`simulated: true`）

---

## 数据模型

### ProductInput（创建/更新请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 商品名称 |
| category | string | 是 | 分类标识 |
| categoryName | string | 是 | 分类显示名 |
| price | number | 是 | 默认售价 |
| originalPrice | number | 否 | 原价 |
| description | string | 是 | 描述 |
| image | string | 是 | 图标 |
| tags | string[] | 否 | 标签 |
| rating | number | 否 | 评分 |
| sales | number | 否 | 销量 |
| stock | number | 否 | 库存 |
| specs | ProductSpec[] | 是 | 规格 |
| ingredients | string[] | 否 | 配料 |

### ProductSpec

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| size | string | 是 | 规格名称，如「大杯 500ml」 |
| price | number | 是 | 该规格售价 |

### Product

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 商品 ID（自增） |
| name | string | 是 | 商品名称 |
| category | string | 是 | 分类标识 |
| categoryName | string | 是 | 分类显示名 |
| price | number | 是 | 列表页展示的默认价格 |
| originalPrice | number | 否 | 原价 |
| description | string | 是 | 商品描述 |
| image | string | 是 | 展示图标 |
| tags | string[] | 是 | 标签 |
| rating | number | 是 | 评分 0~5 |
| sales | number | 是 | 累计销量 |
| stock | number | 是 | 当前库存 |
| specs | ProductSpec[] | 是 | 规格与价格 |
| ingredients | string[] | 否 | 配料 |

### Category

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 分类标识，`all` 表示全部 |
| name | string | 是 | 分类显示名 |

---

## 数据库表结构

表名：`products`（定义见 `server/sql/products.sql`）

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 商品名称 |
| category | VARCHAR(50) | 分类标识，有索引 |
| category_name | VARCHAR(50) | 分类名称 |
| price | DECIMAL(10,2) | 默认售价 |
| original_price | DECIMAL(10,2) | 原价，可空 |
| description | TEXT | 描述 |
| image | VARCHAR(20) | 图标 |
| tags | JSON | 标签数组 |
| rating | DECIMAL(2,1) | 评分，默认 5.0 |
| sales | INT | 销量，默认 0 |
| stock | INT | 库存，默认 0 |
| specs | JSON | `[{size, price}]` |
| ingredients | JSON | 配料数组，可空 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**导入示例数据：**

```bash
mysql -u root -p nuxt_interaction < server/sql/products.sql
```

---

## 前端调用参考

| 页面/模块 | 调用接口 |
|-----------|----------|
| `app/pages/products/index.vue` | `GET /api/products`（带 category、keyword） |
| `app/pages/products/[id].vue` | `GET /api/products/{id}` |
| `app/pages/payment/index.vue` | `GET /api/products/{id}` + `POST /api/orders/checkout` |
| `app/pages/dashboard/manage-products.vue` | 商品 CRUD 全接口 |
| `app/composables/useActionExecutor.ts` | `GET /api/products`（AI 下单匹配商品） |

类型定义：`app/types/product.ts`
