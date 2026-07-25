# deployment — 构建部署规范

> 本文件规定前端 Vite 构建、Nginx 部署与 Docker 化的约束。

---

## 1. 构建配置

```ts
// vite.config.ts
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'element-plus': ['element-plus'],
        'vue-vendor': ['vue', 'vue-router', 'pinia'],
      },
    },
  },
},
```

---

## 2. package.json scripts

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build:test": "vite build --mode test",
    "build:prod": "vite build --mode production",
    "preview": "vite preview"
  }
}
```

---

## 3. Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;

    root /usr/share/nginx/html;
    index index.html;

    # 前端 SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend:8200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 4. Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /build
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:prod

FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. 禁止事项

- ❌ 生产环境开启 sourcemap
- ❌ 不做 chunk 分包（初始加载过慢）
- ❌ Nginx 不配置 SPA `try_files`
