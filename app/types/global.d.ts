import type { PageAgent } from 'page-agent'

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string }
  }
}

declare module '#app' {
  interface NuxtApp {
    $pageAgent: PageAgent
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $pageAgent: PageAgent
  }
}

export {}
