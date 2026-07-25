# deployment — 构建与发布规范

> 本文件规定小程序构建、版本管理与发布的约束。

---

## 1. 环境配置

| 环境 | 用途 | 命令 |
|---|---|---|
| dev | 本地开发 | `npm run dev:mp-weixin` |
| test | 测试/体验版 | `npm run build:test` |
| prod | 生产发布 | `npm run build:prod` |

---

## 2. package.json scripts

```json
{
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:test": "uni build -p mp-weixin --mode test",
    "build:prod": "uni build -p mp-weixin --mode production"
  }
}
```

---

## 3. 版本管理

- 每次提审版本号递增（`versionName` + `versionCode`）
- `manifest.json` 中维护版本号
- CI/CD 自动注入构建号

---

## 4. 发布前检查清单

- [ ] API 地址切换到生产环境
- [ ] 微信小程序 AppID 正确
- [ ] 服务器域名已配置（request/uploadFile/downloadFile）
- [ ] 隐私接口已配置
- [ ] 订阅消息模板 ID 为生产环境
- [ ] 无 `console.log` 遗留（或统一关闭）
- [ ] 图片/图标均使用 CDN
- [ ] 分包不超过 2MB（主包）/ 20MB（总）

---

## 5. 性能优化（微信原生核心约束）

### 5.1 setData 优化（最重要）

```js
// ❌ 错误：频繁全量 setData
this.setData({ list: newList });

// ✅ 正确：只传变化的字段
this.setData({ 'list[' + idx + '].status': 'done' });

// ✅ 正确：合并连续调用
var updates = {};
updates['list'] = newList;
updates['hasMore'] = false;
updates['loadStatus'] = 'nomore';
this.setData(updates);  // 一次调用
```

> **原则**：一次 `setData` 调用传递的数据不超过 256KB，每秒调用不超过 20 次。

### 5.2 分包策略

| 分包类型 | 限制 | 策略 |
|---------|------|------|
| 主包 | < 2MB | TabBar 页面 + 全局样式 + 工具函数 + 首页 |
| 普通分包 | < 2MB / 个 | 按业务模块：商品/订单/用户 |
| 独立分包 | < 2MB / 个 | 不依赖主包的场景（如秒杀页） |
| 总包 | < 20MB | 所有分包之和 |

```json
// app.json — 分包配置
{
  "subPackages": [
    { "root": "pages/goods", "pages": ["list/list", "detail/detail"] },
    { "root": "pages/order", "pages": ["list/list"] }
  ],
  "preloadRule": {
    "pages/home/home": {
      "network": "all",
      "packages": ["pages/goods"]  // 首页预下载商品分包
    }
  }
}
```

### 5.3 图片性能

```xml
<!-- 懒加载 -->
<image src="{{url}}" lazy-load="{{true}}" mode="aspectFill" />

<!-- 列表中的图片建议设固定宽高比 -->
<image src="{{url}}" mode="aspectFill" style="width:160rpx;height:160rpx" />
```

### 5.4 首屏指标

| 指标 | 目标 | 检查方式 |
|------|------|---------|
| 首屏渲染 | < 1.5s | 微信开发者工具 → 性能面板 |
| `setData` 调用频率 | < 20 次/s | 性能面板 |
| `setData` 数据量 | < 256KB/次 | 性能面板 |
| 主包大小 | < 2MB | 开发者工具 → 代码质量 |

---

## 6. 禁止事项

- ❌ 开发环境 AppID 提交到生产版本
- ❌ 生产包含 `console.log`（应配置 terser 移除）
- ❌ 未经测试直接提审生产
- ❌ 版本号回退
