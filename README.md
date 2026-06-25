nuxt-interaction/

# ───────────────────────── 自动生成目录（无需手动修改，Git忽略） ─────────────────────────

├── .nuxt/ # Nuxt自动编译缓存/TS类型声明/路由清单（开发/构建生成）
├── .output/ # 构建后部署目录（npm run build生成，直接用于服务器部署）

# ───────────────────────── 编辑器/工程化协作配置（团队开发必备） ─────────────────────────

├── .vscode/ # VSCode团队统一配置
│   ├── extensions.json # 必装插件（Vue-Official、Nuxt、ESLint、Prettier）
│   ├── settings.json # 代码格式化/校验/自动补全规则（贴合Nuxt开发）
│   └── launch.json # Nuxt断点调试配置（客户端/服务端双端调试）
├── .husky/ # Git钩子（提交前校验代码，避免不合规代码入库）
│   ├── pre-commit # 提交前执行：代码格式化+ESLint校验
│   └── commit-msg # 校验Git提交信息格式（如Angular规范）
├── .github/ # GitHub CI/CD配置（自动构建/部署）
│   └── workflows/
│       └── deploy.yml # 自动部署流程（适配Vercel/Netlify/阿里云ECS等）

# ───────────────────────── 项目核心：app 目录（Nuxt 4 默认源目录，所有应用逻辑集中区） ─────────────────────────

├── app/ # Nuxt 4 唯一核心源目录，srcDir 默认为 app/
│   ├── pages/ # 路由页面目录（自动生成路由，基于文件系统）
│   │   ├── index.vue # 首页 → 对应路由 /
│   │   ├── about/
│   │   │   └── index.vue # 关于页 → 对应路由 /about
│   │   ├── products/ # 商品业务模块
│   │   │   ├── index.vue # 商品列表 → /products
│   │   │   ├── [id].vue # 商品详情（动态路由）→ /products/123
│   │   │   └── create.vue # 商品创建 → /products/create
│   │   ├── admin/ # 管理端模块（需权限）
│   │   │   ├── index.vue # 管理首页 → /admin
│   │   │   ├── users/
│   │   │   │   ├── index.vue # 用户列表 → /admin/users
│   │   │   │   └── [id].vue # 用户编辑 → /admin/users/123
│   │   │   └── settings.vue # 管理端设置 → /admin/settings
│   │   ├── auth/ # 鉴权模块
│   │   │   ├── login.vue # 登录页 → /auth/login
│   │   │   └── register.vue # 注册页 → /auth/register
│   │   ├── 404.vue # 404页面（匹配所有未定义路由）
│   │   └── 500.vue # 500服务端错误页面（SSR场景专用）
│   ├── components/ # 全局组件（自动导入，全项目可用，按模块分类）
│   │   ├── ui/ # 基础UI组件（项目通用：Button、Input、Card、Loading等）
│   │   ├── layout/ # 布局配套组件（Header、Footer、Sidebar等）
│   │   ├── business/ # 业务专属组件（ProductCard、OrderForm、UserInfo等）
│   │   └── icons/ # 图标组件（统一封装：IconSearch、IconCart、IconUser等）
│   ├── composables/ # 组合式函数（自动导入，抽离复用逻辑）
│   │   ├── useApi.ts # 全局接口请求（封装$fetch、拦截器、错误处理）
│   │   ├── useAuth.ts # 权限鉴权（token管理、登录状态、权限判断）
│   │   ├── useTools.ts # 通用工具（时间格式化、数据校验、本地存储）
│   │   └── useStorage.ts # 跨端存储（封装useCookie/useLocalStorage，区分客户端/服务端）
│   ├── layouts/ # 布局组件（自动导入，包裹页面内容）
│   │   ├── default.vue # 默认布局（含Header+Footer，大部分页面使用）
│   │   ├── blank.vue # 空白布局（登录/404/500页，无多余布局元素）
│   │   └── admin.vue # 管理端专属布局（侧边栏+主体，适配后台页面）
│   ├── middleware/ # 路由中间件（自动识别，分「全局/命名」，路由拦截专用）
│   │   ├── auth.global.ts # 全局中间件（所有路由生效，如登录状态校验）
│   │   ├── permission.ts # 命名中间件（手动引用，如管理端权限校验）
│   │   └── guest.ts # 命名中间件（如登录页禁止已登录用户访问）
│   ├── plugins/ # 全局插件（自动注册，区分「客户端/服务端/双端」）
│   │   ├── pinia.ts # Pinia状态管理注册（无后缀，客户端+服务端均执行）
│   │   ├── axios.client.ts # Axios扩展（.client后缀，仅浏览器客户端执行）
│   │   └── analytics.client.ts # 埋点统计（.client后缀，仅客户端执行，避免服务端报错）
│   ├── stores/ # Pinia状态管理（自动导入，无需手动注册）
│   │   ├── app.ts # 应用全局状态（主题、语言、全局加载、弹窗状态）
│   │   ├── user.ts # 用户状态（登录信息、权限、个人资料，持久化存储）
│   │   └── cart.ts # 业务状态（购物车、收藏夹，按需添加其他业务模块）
│   ├── types/ # TypeScript全局类型声明（全项目生效，类型安全保障）
│   │   ├── api.ts # API请求/返回数据类型（如LoginReq、ProductRes、UserInfo）
│   │   ├── models.ts # 业务模型类型（如Product、User、Order，统一数据结构）
│   │   └── global.d.ts # 全局类型扩展（如Window、NuxtApp自定义属性，避免类型报错）
│   ├── config/ # 业务配置抽离（避免硬编码，环境区分，便于维护）
│   │   ├── api.ts # API配置（基础URL、超时时间、默认请求头）
│   │   ├── theme.ts # 主题配置（主题色、字体大小、响应式断点）
│   │   └── constants.ts # 全局常量（状态码、正则表达式、路由白名单、业务枚举）
│   ├── app.vue # 项目唯一根组件（顶层包裹所有布局/页面）
│   ├── seo.ts # 全局SEO配置（标题、Meta、Favicon、外链样式/脚本，使用 useSeoMeta）
│   ├── error.vue # 全局错误页面（捕获应用所有异常，自定义错误样式）
│   └── router.options.ts # 自定义路由配置（路由守卫、别名、模式、白名单，精细控制路由）

# ───────────────────────── 静态资源目录（根级别，与app同级，Nuxt 约定） ─────────────────────────

├── assets/ # 需编译优化的静态资源（Vite处理：压缩/哈希/按需加载）
│   ├── css/ # 全局样式
│   │   ├── main.scss # 全局基础样式（样式重置、通用样式、全局引入）
│   │   └── variables.scss # CSS变量/主题色/字体/断点（全局注入，所有组件可直接用）
│   ├── fonts/ # 自定义本地字体（如思源黑体、图标字体，会被编译优化）
│   ├── images/ # 需优化的图片（logo、插图、业务图片，自动压缩）
│   │   ├── logo/ # Logo相关图片
│   │   └── business/ # 业务相关图片
│   └── scripts/ # 第三方原生脚本（如兼容SDK、非Vue封装的插件，按需引入）
├── public/ # 纯静态资源（无编译，直接复制到输出目录，URL直接访问）
│   ├── favicon.ico # 网站图标（直接访问：/favicon.ico）
│   ├── robots.txt # SEO爬虫规则（告诉搜索引擎哪些页面可爬）
│   ├── sitemap.xml # 站点地图（SEO必备，告诉搜索引擎网站路由结构）
│   ├── images/ # 无需编译的图片（大背景、第三方图标、二维码，直接访问：/images/xxx.png）
│   └── static/ # 静态下载文件（PDF/Excel/JSON，直接访问：/static/xxx.pdf）

# ───────────────────────── Nuxt 内置服务端（根级别，前后端同构，无需单独搭后端） ─────────────────────────

├── server/ # Nitro 服务端引擎目录，写API/服务端逻辑，自动生成/api/*接口
│   ├── api/ # API接口路由（自动映射前端请求路径：/api/xxx）
│   │   ├── auth.ts # 鉴权接口 → 前端请求：$fetch('/api/auth/login')
│   │   ├── products/
│   │   │   ├── index.ts # 商品列表/创建 → GET/POST /api/products
│   │   │   └── [id].ts # 商品详情/编辑/删除 → GET/PUT/DELETE /api/products/:id
│   │   └── users.ts # 用户信息接口 → /api/users/info
│   ├── middleware/ # 服务端API中间件（拦截所有/api/*请求，仅服务端执行）
│   │   ├── auth.ts # API权限校验（验证token，非法请求直接拦截）
│   │   └── logger.ts # API请求日志（记录请求/响应/错误，便于问题排查）
│   └── utils/ # 服务端专属工具函数
│       ├── db.ts # 数据库连接（如Prisma/MongoDB/MySQL，仅服务端执行）
│       └── validate.ts # 服务端数据校验（如zod校验接口入参，避免脏数据）

# ───────────────────────── 测试目录（生产级项目，代码质量保障） ─────────────────────────

├── tests/
│   ├── unit/ # 单元测试（测试独立模块：组件/组合式函数/Pinia状态）
│   │   ├── components/ # 组件单元测试
│   │   ├── composables/ # 组合式函数单元测试
│   │   └── stores/ # Pinia状态单元测试
│   └── e2e/ # 端到端测试（测试完整业务流程，如登录→下单→退出）
│       └── auth.spec.ts # 鉴权流程测试示例（登录/注册/权限拦截）

# ───────────────────────── 根目录核心配置文件（Nuxt 约定，不可随意改名/移动） ─────────────────────────

├── .env # 本地开发环境变量（如API_BASE_URL=http://localhost:3000）
├── .env.development # 测试环境变量（如API_BASE_URL=https://test-api.xxx.com）
├── .env.production # 生产环境变量（如API_BASE_URL=https://api.xxx.com）
├── eslint.config.js # ESLint扁平化配置（贴合Vue3/Nuxt 4/TS，团队统一规则）
├── .prettierrc # Prettier代码格式化配置（与ESLint配合，避免格式冲突）
├── .prettierignore # Prettier忽略文件（与ESLint忽略保持一致）
├── .gitignore # Git忽略文件（不提交自动生成目录/依赖/环境变量等）
├── nuxt.config.ts # Nuxt 核心配置入口（模块、SSR、构建、别名、runtimeConfig等）
├── package.json # 项目依赖/脚本（dev/build/preview/lint/test，核心脚本）
├── package-lock.json # 依赖锁文件（npm用；pnpm用pnpm-lock.yaml，yarn用yarn.lock，三者互斥）
├── tsconfig.json # TypeScript基础配置（Nuxt自动扩展，无需过多修改）
└── README.md

# ───────────────────────── 使用说明 ─────────────────────────

> **注意：** 以上目录结构为项目完整蓝图，非一次性全部创建。建议按功能迭代逐步添加目录和文件，避免过早过度设计。
>
> - 起步阶段：先搭建 `app/pages/`、`app/layouts/`、`server/api/` 核心骨架
> - 开发阶段：随业务引入 `app/stores/`、`app/composables/`、`app/components/`
> - 生产阶段：补齐 `.husky/`、`.github/workflows/`、`tests/` 等工程化设施
