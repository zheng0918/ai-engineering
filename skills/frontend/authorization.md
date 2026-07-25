# authorization — 登录鉴权生成技能

> 本技能生成登录页面、token 管理工具与 Axios 拦截器。

---

## 生成清单

- `pages/login/index.vue` — 登录页
- `utils/auth.ts` — token get/set/remove
- `api/request.ts` — Axios 拦截器（token 注入 + 过期处理）
- `router/guard.ts` — 路由守卫

## utils/auth.ts

```ts
import { APP_CONFIG } from '@/config';

export const getToken = (): string | null =>
  localStorage.getItem(APP_CONFIG.tokenKey);

export const setToken = (token: string): void =>
  localStorage.setItem(APP_CONFIG.tokenKey, token);

export const removeToken = (): void =>
  localStorage.removeItem(APP_CONFIG.tokenKey);
```
