# config — 配置生成技能

> 本技能生成环境变量、manifest.json 与应用常量。

---

## 生成清单

- `config/env.ts` — 多环境 API 地址
- `config/index.ts` — 应用常量
- `.env.development` — Vite 环境变量（dev）
- `.env.production` — Vite 环境变量（prod）

## .env.development

```bash
VITE_ENV = dev
VITE_API_BASE = http://localhost:8200
```

## .env.production

```bash
VITE_ENV = prod
VITE_API_BASE = https://api.example.com
```
