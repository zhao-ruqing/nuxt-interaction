// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  // DevTools 调试面板配置
  devtools: {
    enabled: true,
  },

  // 全局样式（仅引入一次）
  css: ["@/styles/reset.scss", "@/styles/global.scss"],

  // 配置 Vite 插件
  // 通过 additionalData 注入变量和 mixins，所有组件 SCSS 可直接使用
  vite: {
    // 启动 dev server 后自动打开浏览器
    server: {
      open: true,
    },
    // 预构建 CJS 依赖，避免运行时发现新依赖导致页面重载
    optimizeDeps: {
      include: ["@amap/amap-jsapi-loader", "gsap", "gsap/ScrollTrigger"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData:
            '@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;',
        },
      },
    },
  },

  // 显式指定服务端目录（相对于项目根目录）
  serverDir: "./server",

  // 导入 Element Plus 组件,使用module的方式导入可以自动配置element-plus组件
  modules: ["@element-plus/nuxt", "@pinia/nuxt", "@sentry/nuxt/module"],

  // Sentry 构建期配置（org/project 与 wizard 参数一致）
  sentry: {
    org: "zhaoruqing",
    project: "javascript-nuxt",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },

  // 客户端 Source Map（配合 sentry 上传）
  sourcemap: { client: "hidden" },

  // 运行时全局变量
  runtimeConfig: {
    count: 0, // 写在外面的是服务端的变量,在客户端是访问不到的
    // Dify AI 配置（API Key 存于数据库 system_configs 表，环境变量 DIFY_API_KEY 为备用）
    difyApiBase: "https://api.dify.ai/v1",
    // DeepSeek AI 配置（API Key 存于数据库 system_configs 表）
    deepseekApiBase: "https://api.deepseek.com",
    deepseekModel: "deepseek-v4-flash",
    // public表示在客户端和服务端都可以访问的变量
    public: {
      baseURL: "http://localhost:3000",
    },
  },
});
