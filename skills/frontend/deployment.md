# deployment — 构建部署生成技能

> 本技能生成 Vite 构建配置、Nginx 配置、Dockerfile、环境变量。

---

## 发布前检查清单

- [ ] API 地址切换到生产环境
- [ ] `VITE_API_BASE` 正确配置
- [ ] `console.log` 已移除（terser `drop_console: true`）
- [ ] chunk 已分包（element-plus/vue-vendor 独立）
- [ ] Nginx `try_files` 配置 SPA 路由
- [ ] gzip 压缩已开启（Nginx）
- [ ] 静态资源 CDN 已配置（可选）
