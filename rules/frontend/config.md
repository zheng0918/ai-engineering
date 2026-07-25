# config — 前端配置规范

> 本文件规定环境变量、应用常量与 Vite 构建配置的约束。

---

## 1. 环境变量

```ts
// config/env.ts
interface EnvConfig {
  API_BASE: string;
  APP_TITLE: string;
}

const env: Record<string, EnvConfig> = {
  development: {
    API_BASE: import.meta.env.VITE_API_BASE,
    APP_TITLE: import.meta.env.VITE_APP_TITLE,
  },
  production: {
    API_BASE: import.meta.env.VITE_API_BASE,
    APP_TITLE: import.meta.env.VITE_APP_TITLE,
  },
};

export const config = env[import.meta.env.MODE];
```

---

## 2. 应用常量

```ts
// config/index.ts
export const APP_CONFIG = {
  name: '管理后台',
  version: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
  uploadMaxSize: 10 * 1024 * 1024, // 10MB
  tokenKey: 'app_token',
  refreshTokenKey: 'app_refresh_token',
} as const;
```

---

## 3. env.d.ts（类型声明）

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 4. 禁止事项

- ❌ 环境变量不声明类型
- ❌ API 地址硬编码在业务代码中
- ❌ 敏感信息（密钥）放在前端环境变量中
