// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  // 配置启动后自动打开浏览器（Nuxt 3推荐方式）
  devtools: {
    enabled: true,
    open: true,
  },

  // 全局样式（仅引入一次）
  css: [
    '@/styles/reset.scss',
    '@/styles/global.scss',
  ],

  // 配置 Vite 插件
  // 通过 additionalData 注入变量和 mixins，所有组件 SCSS 可直接使用
  vite: {
    // 预构建 CJS 依赖，避免运行时发现新依赖导致页面重载
    optimizeDeps: {
      include: [
        '@amap/amap-jsapi-loader',
        'gsap',
        'gsap/ScrollTrigger',
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/variables.scss" as *; @use "@/styles/mixins.scss" as *;',
        },
      },
    },
  },

  // 显式指定服务端目录（相对于项目根目录）
  serverDir: './server',

  // 导入 Element Plus 组件,使用module的方式导入可以自动配置element-plus组件
  modules: ["@element-plus/nuxt", "@pinia/nuxt"],

  // 运行时全局变量
  runtimeConfig: {
    count: 0, // 写在外面的是服务端的变量,在客户端是访问不到的
    // Dify AI 配置（仅服务端可访问，可通过环境变量 DIFY_API_KEY 覆盖）
    difyApiKey: process.env.DIFY_API_KEY || 'app-F3VCgpqjGCoWKXMu22vAEL2f',
    difyApiBase: 'https://api.dify.ai/v1',
    // public表示在客户端和服务端都可以访问的变量
    public: {
      baseURL: "http://localhost:3000",
    },
  },
});
