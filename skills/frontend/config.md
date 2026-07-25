# config — 配置生成技能

> 本技能生成环境变量、应用常量、Vite 配置与类型声明。

---

## 生成清单

- `config/env.ts`
- `config/index.ts`
- `env.d.ts`
- `.env.development`
- `.env.production`
- `vite.config.ts`（含路径别名 + SCSS 全局注入 + 代理）

## Vite 代理配置

```ts
// 开发代理 → 解决跨域
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8200',
      changeOrigin: true,
    },
  },
},
```
